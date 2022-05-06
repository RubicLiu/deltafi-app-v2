import { InputBaseProps } from "@material-ui/core";
import { TokenConfig } from "constants/deployConfigV2";

export interface DropDownProps<T extends TokenConfig> {
  value: T;
  options: Array<T>;
  onChange: (value: T) => void;
  inputProps?: InputBaseProps;
  disableDrop?: boolean;
}
