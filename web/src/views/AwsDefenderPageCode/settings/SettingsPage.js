import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  Divider,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  Box,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { useSnackbar } from "notistack";

import axiosInstance from "utils/axios";

const schema = yup.object().shape({});

const SettingsPage = () => {
  const { enqueueSnackbar } = useSnackbar(); // Snackbar hook

  const [modelOptions, setModelOptions] = useState([]);
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      iterations: 15,
      number2: 0,
      titleMonitoring: false,
      dropdownOption: "gpt-3.5-turbo",
    },
  });

  const value = watch();

  // Simulate an API call to fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/settings");

        if (response.status === 200) {
          const data = response.data;
          setValue("iterations", data.max_requests);
          setValue("titleMonitoring", data.monitor_mode);
          setValue("dropdownOption", data.openai_model);
          setValue("number2", data.other_settings || "0");
        } else {
          console.error("Failed to fetch data:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchModelOptions = async () => {
      try {
        const response = await axiosInstance.get("/get_models");
        if (response.status === 200) {
          const data = response.data;
          setModelOptions(data);
          enqueueSnackbar("Model Types Fetched", { variant: "success" });
        } else {
          console.error("Failed to fetch data:", response.statusText);
          enqueueSnackbar("Failed to fetch Model Types", { variant: "error" });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar("Failed to fetch Model Types", { variant: "error" });
      }
    };
    fetchData();
    enqueueSnackbar("Fetching Model Types", { variant: "info" });
    fetchModelOptions();
  }, [setValue, enqueueSnackbar]);

  const RecommendationBox = () => (
    <Box
      sx={{
        ml: 1,
        display: "flex",
        alignItems: "center",
        color: "white",
        background: "linear-gradient(to right, #8E2DE2, #4A00E0)",
        padding: "4px",
        borderRadius: "4px",
      }}
    >
      <StarIcon fontSize="small" />
      <Typography variant="subtitle2">Recommended</Typography>
    </Box>
  );

  const [showRecommendation, setShowRecommendation] = useState(false);

  const handleChange = (event) => {
    setShowRecommendation(false);
    setValue("dropdownOption", event.target.value);
  };

  const handleOpen = () => {
    setShowRecommendation(true);
  };

  const handleClose = () => {
    setShowRecommendation(false);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        max_requests: data.iterations,
        monitor_mode: data.titleMonitoring,
        openai_model: data.dropdownOption,
        other_settings: data.number2,
      };

      const response = await axiosInstance.post("/update_settings", payload);
      if (response.status === 200) {
        enqueueSnackbar("Settings updated successfully", {
          variant: "success",
        }); // Display success message
        // wait for 1 second before reloading the page
        setTimeout(() => {
          window.location.reload();
        }, 100);
        // window.location.reload();
      } else {
        console.error("Failed to update settings:", response.statusText);
        enqueueSnackbar("Failed to update settings", { variant: "error" }); // Display success message
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Card
      style={{
        maxWidth: "45%",
        margin: "auto",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: "12px",
      }}
    >
      <CardContent>
        <Typography variant="h4" align="center" sx={{ pb: 2 }} gutterBottom>
          Settings
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ pb: 2 }}>
                GPT-Model
              </Typography>

              <Controller
                name="dropdownOption"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    error={!!errors.dropdownOption}
                    helpertext={
                      errors.dropdownOption ? errors.dropdownOption.message : ""
                    }
                    fullWidth
                    variant="outlined"
                    value={field.value}
                    onOpen={handleOpen}
                    onClose={handleClose}
                    onChange={handleChange}
                  >
                    {modelOptions.map((option, index) => {
                      let label = option;
                      if (option === "gpt-3.5-turbo") {
                        label = "GPT 3.5 Turbo";
                      }
                      if (option === "gpt-4-turbo-preview") {
                        label = "GPT 4";
                      }
                      return (
                        <MenuItem key={index} value={option}>
                          {label}
                          {showRecommendation &&
                            option === "gpt-4-turbo-preview" &&
                            value.dropdownOption !== "gpt-4-turbo-preview" && (
                              <RecommendationBox />
                            )}
                        </MenuItem>
                      );
                    })}
                  </Select>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={10}>
              <Typography variant="h5" sx={{ pt: 1, fontWeight: "bold" }}>
                Monitoring
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <FormControlLabel
                control={
                  <Switch
                    {...control}
                    name="titleMonitoring"
                    checked={value.titleMonitoring}
                    onChange={(event) => {
                      setValue("titleMonitoring", event.target.checked);
                    }}
                    color="success"
                  />
                }
                label=""
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h5" sx={{ pb: 2 }}>
                Max Iterations
              </Typography>
              <Controller
                name="iterations"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Iterations"
                    type="number"
                    error={!!errors.iterations}
                    helpertext={
                      errors.iterations ? errors.iterations.message : ""
                    }
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                style={{ borderRadius: "8px", float: "right" }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default SettingsPage;
