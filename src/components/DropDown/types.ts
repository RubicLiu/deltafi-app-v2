import { InputBaseProps } from "@material-ui/core";

import { TokenInfo } from "constants/tokens";

export interface DropDownProps<T extends TokenInfo> {
  value: T
  options: Array<T>
  onChange: (value: T) => void
  inputProps?: InputBaseProps
  disableDrop?: boolean
}
