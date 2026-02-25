import { forwardRef } from "react";
import {
  ContentController,
  StatusLabel,
  StatusInputField,
  StatusInputShell,
  StatusFill,
  StatusInputsRow,
  StatusMiniInput,
} from "./StatusInput.style";

type StatusType = "vida" | "estamina" | "mana";

interface Props {
  theme: "dark" | "light";
  neon: "on" | "off";
  label?: string;
  type: StatusType;
  value?: string | number;
  maxValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
      maxValue,
      onChange,
      onMaxChange,
      onBlur,
      onFocus,
      editable = true,
      width,
      height,
    },
    ref
  ) => {
    const currentNumber = Number(value ?? 0);
    const maxNumber = Number(maxValue ?? 0);
    const hasDualValue = maxValue !== undefined || !!onMaxChange;
    const percentage = maxNumber > 0 ? Math.min((Math.max(currentNumber, 0) / maxNumber) * 100, 100) : 0;

    return (
      <ContentController width={width} height={height}>
        {label && <StatusLabel>{label}</StatusLabel>}
        {hasDualValue ? (
          <StatusInputShell theme={theme} neon={neon} typeStatus={type} width={width} height={height}>
            <StatusFill typeStatus={type} percentage={percentage} />
            <StatusInputsRow>
              <StatusMiniInput
                align="left"
                emphasis="current"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onFocus={onFocus}
                readOnly={!editable || !onChange}
                ref={ref}
                type="number"
              />
              <StatusMiniInput
                align="right"
                emphasis="max"
                value={maxValue}
                onChange={onMaxChange}
                readOnly={!editable || !onMaxChange}
                type="number"
              />
            </StatusInputsRow>
          </StatusInputShell>
        ) : (
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
        )}
      </ContentController>
    );
  }
);

StatusInput.displayName = 'StatusInput';