import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  Grid,
  InputLabel,
  LinearProgress,
  FormControl,
  MenuItem,
  Select,
  Typography,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";

import { useSnackbar } from "notistack";

import axiosInstance from "utils/axios";

const DashboardCard = () => {
  const { enqueueSnackbar } = useSnackbar(); // Snackbar hook

  const getFindingsData = () => {
    return new Promise((resolve, reject) => {
      const findData = async () => {
        try {
          const findings = await axiosInstance.get("/findings");
          const finalFindings = [];
          for (let i = 0; i < findings.data.length; i++) {
            if (findings.data[i].fixed === false) {
              finalFindings.push({
                id: findings.data[i].id,
                srno: i + 1,
                service: findings.data[i].resource_name,
                region: "NA",
                resource: findings.data[i].resource,
                severity: findings.data[i].severity,
                message: findings.data[i].message,
                issue: findings.data[i].issue,
                details: findings.data[i].details,
                consent: findings.data[i].consent,
                fixed: findings.data[i].fixed,
              });
            }
          }
          resolve(finalFindings);
        } catch (error) {
          reject(error);
        }
      };

      findData();
    });
  };

  useEffect(() => {
    getFindingsData()
      .then((result) => {
        setFindingsData(result);
      })
      .catch((error) => {
        console.error("Error fetching findings data:", error);
      });
  }, []);

  const [selectedServices1, setSelectedServices1] = useState([]);
  const [selectedServices2, setSelectedServices2] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [findingsData, setFindingsData] = useState([]); // Initialize with demo data
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [expandedRows, setExpandedRows] = useState([]);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmedRowId, setConfirmedRowId] = useState(null);
  const [fixingInProgress, setFixingInProgress] = useState(false);

  const handleServiceChange = (event, category) => {
    const selectedServices = event.target.value;
    if (category === 1) {
      setSelectedServices1(selectedServices);
    } else if (category === 2) {
      setSelectedServices2(selectedServices);
    }
  };

  const handleScanButtonClick = async () => {
    if (selectedServices1.length === 0 || selectedServices2.length === 0) {
      enqueueSnackbar("Please select at least one service from each category.", { variant: "info" });
      return;
    }
    const payload = {
      services: selectedServices1.join(","),
      regions: selectedServices2.join(","),
    };

    setIsScanning(true);

    const response = await axiosInstance.post("/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      ...payload,
    });

    // if response message is "Scan started successfully" then output the message to the user
    // scan is done finding vulnerabilities for that check for the scan_id in /scan-status/{scan_id}

    if (response.data.message === "Scan started successfully") {
      enqueueSnackbar("Scan started successfully", { variant: "success" }); // Display success message
      const scanId = response.data.scan_id;

      // make a get request to /scan-status/{scan_id} to check the status of the scan

      // loop it for every 5 seconds to check the status of the scan for max 5 minutes

      // if the status is completed then display the message to the user
      // else it takes time to scan the resources
      let count = 0;
      while (count < 30) {
        const resp = await axiosInstance.get(`/scan-status/${scanId}`);
        if (resp.data.status === "completed") {
          enqueueSnackbar("Scan completed successfully", {
            variant: "success",
          }); // Display success message
          break;
        }
        if (resp.data.status === "failed") {
          enqueueSnackbar("Scan failed", { variant: "error" }); // Display success message
          break;
        }
        count++;
        // sleep for 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    } else {
      enqueueSnackbar("Error starting scan. Please try again.", {
        variant: "error",
      }); // Display success message
    }

    const findings = await axiosInstance.get("/findings");

    const finalFindings = [];

    for (let i = 0; i < findings.data.length; i++) {
      if (findings.data[i].fixed === false) {
        finalFindings.push({
          id: findings.data[i].id,
          srno: i + 1,
          service: findings.data[i].resource_name,
          region: "NA",
          resource: findings.data[i].resource,
          severity: findings.data[i].severity,
          message: findings.data[i].message,
          issue: findings.data[i].issue,
          details: findings.data[i].details,
        });
      }
    }
    setFindingsData(finalFindings);
    setIsScanning(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFixButtonClick = (rowId) => {
    // Close confirmation dialog if it's open
    if (confirmationOpen) {
      setConfirmationOpen(false);
    }

    // Collapse all other rows
    setExpandedRows([rowId]);

    // Open confirmation dialog for the clicked row
    setConfirmedRowId(rowId);
    setConfirmationOpen(true);
  };

  const handleConfirmationClose = (confirmed) => {
    if (confirmed && confirmedRowId !== null) {
      setFixingInProgress(true);
      // Update the consent by sending a post request to the backend
      updateConsent(confirmedRowId, "true");
    } else {
      setExpandedRows((prevExpandedRows) =>
        prevExpandedRows.filter((id) => id !== confirmedRowId)
      );
      // User canceled or closed the dialog, do nothing or handle accordingly
    }
    setConfirmedRowId(null);
    setConfirmationOpen(false);
  };

  const updateConsent = (rowId, consent) => {
    const payload = {
      id: rowId,
      consent: consent,
    };
    axiosInstance
      .post("/update-consent", payload)
      .then((response) => {
        if (response.data.result === "success") {
          enqueueSnackbar(
            "Consent updated successfully. Initiating fix operation...",
            { variant: "success" }
          ); // Display success message
          initiateFixOperation(confirmedRowId);
        } else {
          enqueueSnackbar("Error updating consent. Please try again.", {
            variant: "error",
          }); // Display success message
          setFixingInProgress(false);
          setExpandedRows([]);
        }
      })
      .catch((error) => {
        console.error("Error updating consent:", error);
        enqueueSnackbar("Error updating consent. Please try again.", {
          variant: "error",
        }); // Display success message
        setFixingInProgress(false);
        setExpandedRows([]);
      });
  };

  const initiateFixOperation = (rowId) => {
    const payload = {
      id: rowId,
    };
    setExpandedRows((prevExpandedRows) =>
      prevExpandedRows.filter((id) => id !== rowId)
    );
    axiosInstance
      .post("/patch", payload)
      .then(async (response) => {
        if (response.data.message === "Patch started successfully") {
          enqueueSnackbar("Fix operation started ", { variant: "info" }); // Display success message
          setFixingInProgress(false);
          setExpandedRows([]);

          let patchId = response.data.patch_id;

          let count = 0;
          while (count < 30) {
            const resp = await axiosInstance.get(`/patch-status/${patchId}`);
            if (resp.data.status === "completed") {
              enqueueSnackbar("Problem has been Fixed successfully", {
                variant: "success",
              }); // Display success message

              const findings = await axiosInstance.get("/findings");

              const finalFindings = [];

              for (let i = 0; i < findings.data.length; i++) {
                if (findings.data[i].fixed === false) {
                  finalFindings.push({
                    id: findings.data[i].id,
                    srno: i + 1,
                    service: findings.data[i].resource_name,
                    region: "NA",
                    resource: findings.data[i].resource,
                    severity: findings.data[i].severity,
                    message: findings.data[i].message,
                    issue: findings.data[i].issue,
                    details: findings.data[i].details,
                  });
                }
              }
              setFindingsData(finalFindings);

              break;
            }
            if (resp.data.status === "failed") {
              enqueueSnackbar("Unable to Fixed the Problem", {
                variant: "error",
              }); // Display success message
              break;
            }
            count++;
            // sleep for 5 seconds
            await new Promise((resolve) => setTimeout(resolve, 10000));
          }
        } else {
          enqueueSnackbar("Error fixing the issue. Please try again.", {
            variant: "error",
          }); // Display success message
          setFixingInProgress(false);
          setExpandedRows([]);
        }
      })
      .catch((error) => {
        console.error("Error fixing the issue:", error);
        enqueueSnackbar("Error fixing the issue. Please try again.", {
          variant: "error",
        }); // Display success message
        setFixingInProgress(false);
        setExpandedRows([]);
      });
  };

  const [services, setServices] = useState([]);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    enqueueSnackbar("Fetching services and regions...", { variant: "info" }); // Display success message
    const fetchServices = async () => {
      try {
        const response = await axiosInstance.get("/scan_options");
        setServices(response.data.services);
        setRegions(response.data.regions);
        enqueueSnackbar("Services and regions fetched successfully", {
          variant: "success",
        }); // Display success message
      } catch (error) {
        console.error("Error fetching services:", error);
        enqueueSnackbar("Error fetching services. Please try again.", {
          variant: "error",
        }); // Display success message
      }
    };
    fetchServices();
  }, [enqueueSnackbar]);

  return (
    <Card style={{ maxWidth: "90%", margin: "auto" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Service Selection
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel htmlFor="services" sx={{ pt: "5px" }}>
                Services
              </InputLabel>
              <Select
                value={selectedServices1}
                onChange={(e) => handleServiceChange(e, 1)}
                label="Services"
                multiple
                sx={{ minHeight: 65 }}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {services.map((service) => (
                  <MenuItem key={service} value={service}>
                    {service}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel htmlFor="regions" sx={{ pt: "5px" }}>
                Regions
              </InputLabel>
              <Select
                value={selectedServices2}
                onChange={(e) => handleServiceChange(e, 2)}
                label="Regions"
                multiple
                sx={{ minHeight: 65 }}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {regions.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleScanButtonClick}
          style={{ marginTop: "20px", color: "white" }}
          disabled={isScanning}
        >
          Scan
        </Button>

        {isScanning && (
          <LinearProgress color="error" style={{ marginTop: "20px" }} />
        )}

        {isScanning && (
          <Typography style={{ marginTop: "10px" }}>
            Scanning in progress...
          </Typography>
        )}

        {/* Divider between sections */}
        <Divider sx={{ my: 3 }} />

        {/* Findings Table Section */}
        {findingsData.length > 0 && (
          <div>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Findings
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: "100px" }}>Sr no.</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell sx={{ minWidth: "300px" }}>Message</TableCell>
                    <TableCell sx={{ minWidth: "300px" }}>Issue</TableCell>
                    <TableCell sx={{ minWidth: "300px" }}>Details</TableCell>
                    <TableCell
                      style={{
                        position: "sticky",
                        right: 0,
                        background: "#131314",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(rowsPerPage > 0
                    ? findingsData.slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                    : findingsData
                  ).map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow>
                        <TableCell>{row.srno}</TableCell>
                        <TableCell>{row.service}</TableCell>
                        <TableCell>{row.region}</TableCell>
                        <TableCell>{row.resource}</TableCell>
                        <TableCell>{row.severity}</TableCell>
                        <TableCell>{row.message}</TableCell>
                        <TableCell>{row.issue}</TableCell>
                        <TableCell>{row.details}</TableCell>
                        <TableCell
                          style={{
                            position: "sticky",
                            right: 0,
                            background: "#131314",
                          }}
                        >
                          <Button
                            variant="outlined"
                            color={row.fixed ? "success" : "warning"}
                            onClick={
                              row.fixed
                                ? () => {}
                                : () => handleFixButtonClick(row.id)
                            }
                          >
                            {row.fixed ? "Fixed" : "Fix"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={9}
                        >
                          <Collapse
                            in={expandedRows.includes(row.id)}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ margin: 1 }}>
                              {confirmationOpen && (
                                <ConfirmationDialog
                                  onClose={handleConfirmationClose}
                                />
                              )}
                              {fixingInProgress && (
                                <>
                                  <Typography variant="h6" gutterBottom>
                                    Fixing...
                                  </Typography>
                                  <Typography variant="body2" gutterBottom>
                                    Summary of the fix operation.
                                  </Typography>
                                  <LinearProgress />
                                </>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={findingsData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ConfirmationDialog = ({ onClose }) => {
  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        This action will make changes to your infrastructure and may lead to
        some systems not working properly. Are you sure you want to proceed?
      </Typography>
      <Box mt={2}>
        <Button onClick={() => onClose(false)} color="primary">
          No
        </Button>
        <Button onClick={() => onClose(true)} color="primary" autoFocus>
          Yes
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardCard;
