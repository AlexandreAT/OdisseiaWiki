import { forwardRef } from "react";
import {
  ListController,
  ListItem,
  ItemName,
  DeleteButton
} from "./HorizonatlList.style";
import { RiDeleteBack2Line } from 'react-icons/ri';

interface Item {
  id: number | string;
  nome: string;
}

interface Props {
  theme: "dark" | "light";
  neon: "on" | "off";
  data: Item[];
  onDelete?: (id: string | number) => void;
  width?: string;
}

export const HorizontalList = forwardRef<HTMLDivElement, Props>(
  ({ theme, neon, data, onDelete, width = "100%" }, ref) => {
    return (
      <ListController theme={theme} neon={neon} width={width} ref={ref}>
        {data.map((item) => (
          <ListItem key={item.id} theme={theme} neon={neon}>
            <ItemName>{item.nome}</ItemName>
            {onDelete && (
              <DeleteButton
                type="button"
                theme={theme}
                neon={neon}
                onClick={() => onDelete(item.id)}
              >
                <RiDeleteBack2Line className="icon" />
              </DeleteButton>
            )}
          </ListItem>
        ))}
      </ListController>
    );
  }
);