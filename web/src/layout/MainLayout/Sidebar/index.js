import PropTypes from "prop-types";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Drawer,
  useMediaQuery,
  Avatar,
  ButtonBase,
  Grid,
} from "@mui/material";

// third-party
import PerfectScrollbar from "react-perfect-scrollbar";
import { BrowserView, MobileView } from "react-device-detect";

// project imports
import MenuList from "./MenuList";
import LogoSection from "../LogoSection";
import { drawerWidth } from "store/constant";
import { IconMenu2 } from "@tabler/icons";
// ==============================|| SIDEBAR DRAWER ||============================== //

const Sidebar = ({
  drawerOpen,
  drawerToggle,
  window,
  handleLeftDrawerToggle,
}) => {
  const theme = useTheme();
  const matchUpMd = useMediaQuery(theme.breakpoints.up("md"));

  const drawer = (
    <>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Box sx={{ display: "flex", p: 2, mx: "auto" }}>
          <LogoSection />
        </Box>
      </Box>
      <BrowserView>
        <PerfectScrollbar
          component="div"
          style={{
            height: !matchUpMd ? "calc(100vh - 56px)" : "calc(100vh - 88px)",
            paddingLeft: "16px",
            paddingRight: "16px",
          }}
        >
          <MenuList />
        </PerfectScrollbar>
      </BrowserView>
      <MobileView>
        <Box sx={{ px: 2 }}>
          <MenuList />
        </Box>
      </MobileView>
    </>
  );

  const container =
    window !== undefined ? () => window.document.body : undefined;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          position: "fixed",
        }}
      >
        <Grid container spacing={0}>
          <Grid item xs={10}>
            <ButtonBase
              sx={{ borderRadius: "12px", ml: 2, mt: 2, overflow: "hidden" }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  ...theme.typography.commonAvatar,
                  ...theme.typography.mediumAvatar,
                  transition: "all .2s ease-in-out",
                  background: theme.palette.secondary.light,
                  color: theme.palette.secondary.dark,
                  "&:hover": {
                    background: theme.palette.secondary.dark,
                    color: theme.palette.secondary.light,
                  },
                }}
                onClick={handleLeftDrawerToggle}
                color="inherit"
              >
                <IconMenu2 stroke={1.5} size="1.3rem" />
              </Avatar>
            </ButtonBase>
          </Grid>
        </Grid>
      </Box>

      <Box
        component="nav"
        sx={{ flexShrink: { md: 0 }, width: drawerOpen ? drawerWidth : 360 }}
        aria-label="mailbox folders"
      >
        <Drawer
          container={container}
          variant={matchUpMd ? "persistent" : "temporary"}
          anchor="left"
          open={drawerOpen}
          onClose={drawerToggle}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              background: "#1e1f20",
              color: theme.palette.text.primary,
              borderRight: "none",
              [theme.breakpoints.up("md")]: {
                top: "88px",
              },
            },
          }}
          ModalProps={{ keepMounted: true }}
          color="inherit"
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
};

Sidebar.propTypes = {
  drawerOpen: PropTypes.bool,
  drawerToggle: PropTypes.func,
  window: PropTypes.object,
  handleLeftDrawerToggle: PropTypes.func,
};

export default Sidebar;
