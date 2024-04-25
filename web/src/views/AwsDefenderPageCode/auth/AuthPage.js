import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Divider } from "@mui/material";
import { useSnackbar } from "notistack";
import axiosInstance from "utils/axios";

const schema = yup.object().shape({
  awsAccessKey: yup.string().required("AWS Access Key is required"),
  awsSecretKey: yup.string().required("AWS SECRET KEY is required"),
  openaiAccessKey: yup.string().required("OPEN AI API KEY is required"),
  region: yup.string().required("AWS Region is required"),
});

const AuthPage = () => {
  const { enqueueSnackbar } = useSnackbar(); // Snackbar hook

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      awsAccessKey: "",
      awsSecretKey: "",
      openaiAccessKey: "",
      region: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Simulate an API call to fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/test");
        if (response.status === 200) {
          const data = response.data;
          setValue("awsAccessKey", data.aws_credentials.aws_access_key);
          setValue("awsSecretKey", data.aws_credentials.aws_secret_key);
          setValue("region", data.aws_credentials.aws_region);
          setValue("openaiAccessKey", data.openai_key);
          setFormSubmitted(true); // Optionally, you can set formSubmitted to true if you want to show the toggle buttons initially
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        aws_access_key: data.awsAccessKey,
        aws_secret_key: data.awsSecretKey,
        aws_region: data.region,
        openai_access_key: data.openaiAccessKey,
      };
      const response = await axiosInstance.post("/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        ...payload,
      });

      if (response.status === 200) {
        setFormSubmitted(true);
        enqueueSnackbar("Form submitted successfully", { variant: "success" }); // Display success message
        setShowPassword(false);

        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        console.error("Failed to submit form:", response.statusText);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card
      style={{
        maxWidth: "50%",
        margin: "auto",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: "12px",
      }}
    >
      <CardContent>
        <Typography variant="h4" align="center" sx={{ pb: 2 }} gutterBottom>
          Authentication
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ pb: 2 }}>
                AWS ACCESS KEY
              </Typography>
              <Controller
                name="awsAccessKey"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="KEY"
                    error={!!errors.awsAccessKey}
                    helpertext={
                      errors.awsAccessKey ? errors.awsAccessKey.message : ""
                    }
                    fullWidth
                    variant="outlined"
                    type={
                      formSubmitted
                        ? showPassword
                          ? "text"
                          : "password"
                        : "text"
                    }
                    InputProps={
                      formSubmitted
                        ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={handleTogglePasswordVisibility}
                                  edge="end"
                                >
                                  {showPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }
                        : {}
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h5" sx={{ pb: 2 }}>
                AWS SECRET KEY
              </Typography>
              <Controller
                name="awsSecretKey"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="KEY"
                    error={!!errors.awsSecretKey}
                    helpertext={
                      errors.awsSecretKey ? errors.awsSecretKey.message : ""
                    }
                    fullWidth
                    variant="outlined"
                    type={
                      formSubmitted
                        ? showPassword
                          ? "text"
                          : "password"
                        : "text"
                    }
                    InputProps={
                      formSubmitted
                        ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={handleTogglePasswordVisibility}
                                  edge="end"
                                >
                                  {showPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }
                        : {}
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h5" sx={{ pb: 2 }}>
                OPEN AI API KEY
              </Typography>
              <Controller
                name="openaiAccessKey"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="KEY"
                    error={!!errors.openaiAccessKey}
                    helpertext={
                      errors.openaiAccessKey
                        ? errors.openaiAccessKey.message
                        : ""
                    }
                    fullWidth
                    variant="outlined"
                    type={
                      formSubmitted
                        ? showPassword
                          ? "text"
                          : "password"
                        : "text"
                    }
                    InputProps={
                      formSubmitted
                        ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={handleTogglePasswordVisibility}
                                  edge="end"
                                >
                                  {showPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }
                        : {}
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h5" sx={{ pb: 2 }}>
                Region
              </Typography>
              <Controller
                name="region"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Value"
                    error={!!errors.region}
                    helpertext={errors.region ? errors.region.message : ""}
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

export default AuthPage;
