import { Grid } from "@mui/material";
import DashbaordCard from "./DashbaordCard";
import { Monitor } from "../../../../components/monitor";
import { gridSpacing } from "store/constant";
import { SnackbarProvider } from "notistack";

// ==============================|| DEFAULT DASHBOARD ||============================== //

const Dashboard = () => {
  return (
    <Grid container spacing={gridSpacing}>
      <Grid item xs={9}>
        <SnackbarProvider
          dense
          maxSnack={3}
          preventDuplicate
          autoHideDuration={1500}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <DashbaordCard />
        </SnackbarProvider>
      </Grid>
      <Grid item xs={3}>
        <Monitor />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
