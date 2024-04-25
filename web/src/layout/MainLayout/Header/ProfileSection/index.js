import { useNavigate } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Chip } from "@mui/material";

// assets
import { IconSettings } from "@tabler/icons";

// ==============================|| PROFILE MENU ||============================== //

const ProfileSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/config"); // Redirects to the '/redirected' route
  };

  return (
    <Chip
      sx={{
        height: "48px",
        alignItems: "center",
        borderRadius: "27px",
        transition: "all .2s ease-in-out",
        borderColor: theme.palette.primary.light,
        backgroundColor: theme.palette.primary.light,
        '&[aria-controls="menu-list-grow"], &:hover': {
          borderColor: theme.palette.primary.main,
          background: `${theme.palette.primary.main}!important`,
          color: theme.palette.primary.light,
          "& svg": {
            stroke: theme.palette.primary.light,
          },
        },
        "& .MuiChip-label": {
          lineHeight: 0,
        },
      }}
      label={
        <IconSettings
          stroke={1.5}
          size="1.5rem"
          color={theme.palette.primary.main}
        />
      }
      variant="outlined"
      onClick={handleClick}
      color="primary"
    />
  );
};

export default ProfileSection;
