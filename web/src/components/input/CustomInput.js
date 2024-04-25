import React from "react";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";

const InputContainer = styled("div")({
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  minHeight: "60px",
  width: "100%",
});

const InputAware = styled("div")({
  padding: "0 16px",
  color: "#c1c1c1",
  fontSize: "12px",
  textAlign: "center",
});

const StyledTextField = styled(TextField)({
  ".MuiInputBase-root": {
    color: "#fff",
    "& fieldset": {
      border: "none",
    },
    "&:hover fieldset": {
      border: "none",
    },
    "&.Mui-focused fieldset": {
      border: "none",
    },
  },
});

const CustomInput = ({ value, onChange, onKeyDown, handleMessageSend }) => {
  return (
    <>
      <InputContainer>
        <StyledTextField
          fullWidth
          variant="outlined"
          multiline
          placeholder="Type a message..."
          value={value}
          onChange={(e) => onChange(e)}
          onKeyDown={onKeyDown}
          rowsmax={Infinity}
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleMessageSend}>
                <SendIcon style={{ color: "#fff" }} />
              </IconButton>
            ),
          }}
        />
      </InputContainer>

      <InputAware>
        AWSDefenderGPT interacts with cloud services and may occasionally
        produce mistakes and errors; please verify crucial information
      </InputAware>
    </>
  );
};

export default CustomInput;
