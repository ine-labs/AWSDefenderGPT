import { useState, useEffect } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Avatar, Box, ButtonBase, Tooltip } from "@mui/material";
import axiosInstance from "utils/axios";

import { IconBell } from "@tabler/icons";
import { useSnackbar } from "notistack";

// ==============================|| NOTIFICATION ||============================== //

const NotificationSection = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar(); // Snackbar hook

  const [color, setColor] = useState("primary");
  const [monitorMode, setMonitorMode] = useState(null);

  const handleClick = () => {
    axiosInstance
      .get("/settings")
      .then((response) => {
        if (response && response.status === 200) {
          const data = response.data;
          data.monitor_mode = !data.monitor_mode;
          delete data.id;
          axiosInstance
            .post("/update_settings", data)
            .then((response) => {
              if (response && response.status === 200) {
                enqueueSnackbar(
                  "Monitor mode is turned " +
                    (data.monitor_mode ? "on" : "off") +
                    " successfully",
                  { variant: "success" }
                );
                setMonitorMode(data.monitor_mode);
                setColor(color === "primary" ? "secondary" : "primary");
              }
            })
            .catch((error) => {
              console.error("Error updating monitor mode:", error);
            });
        } else {
          enqueueSnackbar("Unable to update monitor mode", {
            variant: "error",
          });
        }
      })
      .catch((error) => {
        console.error("Error getting monitor mode:", error);
      });
  };

  useEffect(() => {
    if (monitorMode === null) {
      axiosInstance
        .get("/settings")
        .then((response) => {
          if (response && response.status === 200) {
            setMonitorMode(response.data.monitor_mode);
            if (response.data.monitor_mode === true) {
              setColor("secondary");
            }
          }
        })
        .catch((error) => {
          console.error("Error getting monitor mode:", error);
        });
    }
  }, [monitorMode]);

  return (
    <>
      <Box
        sx={{
          ml: 2,
          mr: 3,
          [theme.breakpoints.down("md")]: {
            mr: 2,
          },
        }}
      >
        <Tooltip
          title={
            color === "primary"
              ? "Turn on Monitor mode"
              : "Turn off Monitor mode"
          }
          enterDelay={1000}
          arrow
        >
          <ButtonBase sx={{ borderRadius: "12px" }}>
            <Avatar
              variant="rounded"
              sx={{
                ...theme.typography.commonAvatar,
                ...theme.typography.mediumAvatar,
                transition: "all .2s ease-in-out",
                background:
                  color === "primary"
                    ? theme.palette.secondary.light
                    : theme.palette.success.light,
                color:
                  color === "primary"
                    ? theme.palette.secondary.dark
                    : theme.palette.success.dark,
              }}
              onClick={handleClick}
              color="inherit"
            >
              <IconBell stroke={1.5} size="1.3rem" />
            </Avatar>
          </ButtonBase>
        </Tooltip>
      </Box>
    </>
  );
};

export default NotificationSection;
