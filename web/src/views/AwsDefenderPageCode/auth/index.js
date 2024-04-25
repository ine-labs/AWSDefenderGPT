import { Grid } from "@mui/material";
import { gridSpacing } from "store/constant";
import { SnackbarProvider } from "notistack";
import AuthPage from "./AuthPage";

// ==============================|| DEFAULT DASHBOARD ||============================== //

const AuthLogin = () => {
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
          <AuthPage />
        </SnackbarProvider>
      </Grid>
    </Grid>
  );
};

export default AuthLogin;
