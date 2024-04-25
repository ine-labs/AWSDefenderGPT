import { Grid } from "@mui/material";
import ChatPage from "./ChatPage";
import { Monitor } from "components/monitor";

// ==============================|| DEFAULT DASHBOARD ||============================== //

const MainChatPage = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={9}>
        <ChatPage />
      </Grid>
      <Grid item xs={3}>
        <Monitor />
      </Grid>
    </Grid>
  );
};

export default MainChatPage;
