import { forwardRef } from "react";
import { ContentController, BarContainer, BarFill, ValueText } from "./StatusBar.style";

type StatusType = "vida" | "estamina" | "mana";

interface Props {
  theme?: "dark" | "light";
  neon?: "on" | "off";
  type: StatusType;
  value: number;
  maxValue?: number;
  width?: string;
  height?: string;
}

export const StatusBar = forwardRef<HTMLDivElement, Props>(
  ({ theme = "dark", neon = "off", type, value, maxValue, width, height }, ref) => {
    const percentage =
      maxValue && maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 100;

    return (
      <ContentController width={width} height={height} ref={ref}>
        <BarContainer theme={theme} neon={neon} typeStatus={type}>
          <BarFill
            typeStatus={type}
            style={{ width: `${percentage}%` }}
          />
          <ValueText>
            {value}
            {maxValue ? ` / ${maxValue}` : ""}
          </ValueText>
        </BarContainer>
      </ContentController>
    );
  }
);