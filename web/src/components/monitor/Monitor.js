import React, { useState, useEffect } from "react";
import { useTheme, styled } from "@mui/material/styles";
import {
  CardContent,
  Grid,
  Typography,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Box,
  Button,
  List,
} from "@mui/material";
import MainCard from "ui-component/cards/MainCard";
import { gridSpacing } from "store/constant";
import { useSocketEvents } from "hooks/useSocketEvents";
import axiosInstance from "utils/axios";

// styles
const ListItemWrapper = styled("div")(({ theme }) => ({
  cursor: "pointer",
  padding: 16,
  "&:hover": {
    background: theme.palette.primary.light,
  },
  "& .MuiListItem-root": {
    padding: 0,
  },
}));

const Monitor = () => {
  const theme = useTheme();

  const chipSX = {
    height: 24,
    padding: "0 6px",
    marginRight: "5px",
  };
  const chipErrorSX = {
    ...chipSX,
    color: theme.palette.orange.dark,
    backgroundColor: theme.palette.orange.light,
    marginRight: "5px",
  };

  const chipWarningSX = {
    ...chipSX,
    color: theme.palette.warning.dark,
    backgroundColor: theme.palette.warning.light,
  };

  const commandSX = {
    fontFamily: "Monospace",
    backgroundColor: theme.palette.divider,
    padding: "8px",
    borderRadius: "4px",
    display: "inline-block",
    whiteSpace: "pre-wrap",
    width: "100%",
    marginTop: "8px",
  };

  const [logs, setLogs] = useState([]);
  const [isMonitor, setIsMonitor] = useState(true);

  const events = [
    {
      name: "logs",
      handler(message) {
        setLogs((prevLogs) => [
          {
            id: message.id,
            command: message.data,
            state: "pending",
            color: {
              light: theme.palette.success.light,
              dark: theme.palette.success.dark,
            },
          },
          ...prevLogs,
        ]);
      },
    },
    {
      name: "connect:logs",
      handler(message) {
        setLogs(message.logs);
      },
    },
  ];

  useSocketEvents(events);

  useEffect(() => {
    // Send HTTP GET request to get logs
    axiosInstance
      .get("/settings")
      .then((response) => {
        if (response.status === 200) {
          const data = response.data;
          setIsMonitor(data.monitor_mode);
        }
      })
      .catch((error) => {
        console.error("Error getting monitor status:", error);
      });
  }, []);

  const getMonitorStatus = () => {
    axiosInstance
      .get("/settings")
      .then((response) => {
        if (response.status === 200) {
          const data = response.data;
          setIsMonitor(data.monitor_mode);
        }
      })
      .catch((error) => {
        console.error("Error getting monitor status:", error);
      });
    return isMonitor;
  };

  const handleAccept = (id) => {
    // Send HTTP POST request to accept log with the given ID
    // also update the monitor status
    axiosInstance
      .post(`/update_log_status/${id}`, { action: "accept" })
      .then((response) => {
        // Update logs state after accepting
        const updatedLogs = logs.map((log) =>
          log.id === id ? { ...log, state: "accepted" } : log
        );
        setLogs(updatedLogs);
      })
      .catch((error) => {
        console.error("Error accepting log:", error);
      });
  };

  const handleReject = (id) => {
    // Send HTTP POST request to reject log with the given ID
    axiosInstance
      .post(`/update_log_status/${id}`, { action: "reject" })
      .then((response) => {
        // Update logs state after rejecting
        const updatedLogs = logs.map((log) =>
          log.id === id ? { ...log, state: "rejected" } : log
        );
        setLogs(updatedLogs);
      })
      .catch((error) => {
        console.error("Error rejecting log:", error);
      });
  };

  return (
    <div>
      <MainCard sx={{ minHeight: "80vh" }} content={false}>
        <CardContent>
          <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
              <Box sx={{ overflowY: "auto", maxHeight: 400 }}>
                {" "}
                <List>
                  {logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <ListItemWrapper>
                        <ListItem alignItems="center">
                          <ListItemText primary={"Executing command"} />
                          <ListItemSecondaryAction>
                            <Grid container justifyContent="flex-end">
                              <Grid item xs={12}>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  gutterBottom
                                  sx={{
                                    fontWeight: "bold",
                                    ...(log.state === "pending" && {
                                      color: theme.palette.text.secondary,
                                    }),
                                    ...(log.state === "accepted" && {
                                      color: theme.palette.success.main,
                                    }),
                                    ...(log.state === "rejected" && {
                                      color: theme.palette.error.main,
                                    }),
                                  }}
                                >
                                  {log.state}
                                </Typography>
                              </Grid>
                            </Grid>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Grid
                          container
                          direction="column"
                          className="list-container"
                        >
                          <Grid item xs={12} sx={{ pb: 2 }}>
                            <Typography variant="subtitle2" sx={commandSX}>
                              {log.command}
                            </Typography>
                          </Grid>
                          {log.state === "pending" && getMonitorStatus() ? (
                            <Grid item xs={12}>
                              <Grid container>
                                <Grid item>
                                  <Button
                                    variant="contained"
                                    onClick={() => handleAccept(log.id)}
                                    sx={chipWarningSX}
                                  >
                                    Accept
                                  </Button>
                                </Grid>
                                <Grid item>
                                  <Button
                                    variant="contained"
                                    onClick={() => handleReject(log.id)}
                                    sx={chipErrorSX}
                                  >
                                    Reject
                                  </Button>
                                </Grid>
                              </Grid>
                            </Grid>
                          ) : (
                            handleAccept(log.id)
                          )}
                        </Grid>
                      </ListItemWrapper>
                      <Divider sx={{ my: 1.5 }} />
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </MainCard>
    </div>
  );
};

export default Monitor;
