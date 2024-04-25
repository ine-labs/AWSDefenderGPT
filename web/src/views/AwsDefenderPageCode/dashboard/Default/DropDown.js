import React, { useState, useEffect } from "react";
import {
  MenuItem,
  Select,
  Box,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star"; // Import the icon you want to use
import axiosInstance from "utils/axios";
import { useSnackbar } from "notistack";

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

const DropDown = () => {
  const [selectedOption, setSelectedOption] = useState("gpt4");
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [modelOptions, setModelOptions] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const handleChange = (event) => {
    setShowRecommendation(false);
    enqueueSnackbar("Updating Model Type", { variant: "info" });
    axiosInstance
      .get("/settings")
      .then((response) => {
        if (response.status === 200) {
          const data = response.data;
          data.openai_model = event.target.value;
          delete data.id;
          axiosInstance
            .post("/update_settings", data)
            .then((response) => {
              if (response && response.status === 200) {
                setSelectedOption(event.target.value);
                enqueueSnackbar("Model Type Updated", { variant: "success" });
              }
            })
            .catch((error) => {
              console.error("Error updating model type:", error);
              enqueueSnackbar("Failed to update Model Type", {
                variant: "error",
              });
            });
        } else {
          enqueueSnackbar("Unable to update Model Type", { variant: "error" });
        }
      })
      .catch((error) => {
        console.error("Error getting model type:", error);
        enqueueSnackbar("Failed to fetch Model Type", { variant: "error" });
      });
  };

  const handleOpen = () => {
    setShowRecommendation(true);
  };

  const handleClose = () => {
    setShowRecommendation(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/settings");

        if (response.status === 200) {
          const data = response.data;
          setSelectedOption(data.openai_model);
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
  }, [enqueueSnackbar]);

  return (
    <div>
      <Select
        labelId="dropdown-label"
        id="dropdown"
        value={selectedOption}
        onOpen={handleOpen}
        onClose={handleClose}
        onChange={handleChange}
        sx={{
          "& .MuiSelect-select.MuiSelect-select": {
            backgroundColor: "#131314", // Background color of the selected item
          },
          "& .MuiSelect-icon": {
            color: "white", // Color of the icon
          },
        }}
        inputProps={{
          MenuProps: {
            MenuListProps: {
              sx: {
                backgroundColor: "#131314",
                pd: 10,
              },
            },
          },
        }}
        fullWidth
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
                selectedOption !== "gpt-4-turbo-preview" && (
                  <RecommendationBox />
                )}
            </MenuItem>
          );
        })}
      </Select>
    </div>
  );
};

export default DropDown;
