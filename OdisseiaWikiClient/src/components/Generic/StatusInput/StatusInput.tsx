import { forwardRef, memo } from "react";
import { ContentController, StatusLabel, StatusInputField } from "./StatusInput.style";

type StatusType = "vida" | "estamina" | "mana";

interface Props {
  theme: "dark" | "light";
  neon: "on" | "off";
  label?: string;
  type: StatusType;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  editable?: boolean;
  width?: string;
  height?: string;
}

export const StatusInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      theme,
      neon,
      label,
      type,
      value,
      onChange,
      onBlur,
      onFocus,
      editable = true,
      width,
      height,
    },
    ref
  ) => {
    return (
      <ContentController width={width} height={height}>
        {label && <StatusLabel>{label}</StatusLabel>}
        <StatusInputField
          theme={theme}
          neon={neon}
          typeStatus={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          readOnly={!editable}
          ref={ref}
          width={width}
          height={height}
        />
      </ContentController>
    );
  }
);

StatusInput.displayName = 'StatusInput';