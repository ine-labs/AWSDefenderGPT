import { useState } from "react";

import { useTheme, styled } from "@mui/material/styles";
import { Box, InputAdornment, OutlinedInput } from "@mui/material";

import { IconSearch } from "@tabler/icons";
import { shouldForwardProp } from "@mui/system";

const OutlineInputStyle = styled(OutlinedInput, { shouldForwardProp })(
  ({ theme }) => ({
    width: "100%",
    "& input": {
      background: "transparent !important",
      paddingLeft: "4px !important",
    },
  })
);

const SearchSection = () => {
  const theme = useTheme();
  const [value, setValue] = useState("");

  return (
    <Box>
      <OutlineInputStyle
        id="input-search-header"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search"
        startAdornment={
          <InputAdornment position="start">
            <IconSearch
              stroke={1.5}
              size="1rem"
              color={theme.palette.grey[500]}
            />
          </InputAdornment>
        }
        aria-describedby="search-helper-text"
        inputProps={{ "aria-label": "weight" }}
      />
    </Box>
  );
};

export default SearchSection;
