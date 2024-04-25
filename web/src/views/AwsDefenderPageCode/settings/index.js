import { Grid } from "@mui/material";
import { gridSpacing } from "store/constant";
import { SnackbarProvider } from "notistack";
import SettingsPage from "./SettingsPage";

// ==============================|| DEFAULT DASHBOARD ||============================== //

const SettingsMain = () => {
  return (
    <Grid container spacing={gridSpacing}>
      <Grid item xs={12}>
        <SnackbarProvider
          dense
          maxSnack={3}
          preventDuplicate
          autoHideDuration={1500}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <SettingsPage />
        </SnackbarProvider>
      </Grid>
    </Grid>
  );
};

export default SettingsMain;
