import PropTypes from "prop-types";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";

// project imports
import ProfileSection from "./ProfileSection";
import NotificationSection from "./NotificationSection";
import { SnackbarProvider } from "notistack";

// assets
import DropDown from "../../../views/AwsDefenderPageCode/dashboard/Default/DropDown";

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px", // Adjust padding as needed
        [theme.breakpoints.down("md")]: {
          flexDirection: "column",
          alignItems: "flex-start",
          "& > *:not(:last-child)": {
            marginBottom: "10px", // Adjust margin between items on small screens
          },
        },
      }}
    >
      <DropDown />
      <Box sx={{ width: 228 }}></Box>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <SnackbarProvider
          dense
          maxSnack={3}
          preventDuplicate
          autoHideDuration={1500}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <NotificationSection />
        </SnackbarProvider>
        <ProfileSection />
      </Box>
    </Box>
  );
};

Header.propTypes = {
  handleLeftDrawerToggle: PropTypes.func,
};

export default Header;
