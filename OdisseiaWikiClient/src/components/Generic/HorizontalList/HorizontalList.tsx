import { forwardRef, useRef, useState, useEffect } from "react";
import {
  ListWrapper,
  ListController,
  ScrollContainer,
  ListItem,
  ItemName,
  DeleteButton,
  NavigationButton
} from "./HorizonatlList.style";
import { RiDeleteBack2Line } from 'react-icons/ri';
import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";

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
  ({ theme, neon, data, onDelete, width }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollability = () => {
      if (!scrollRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;

      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < maxScroll - 1);
    };

    useEffect(() => {
      checkScrollability();
      
      const scrollContainer = scrollRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', checkScrollability);
        window.addEventListener('resize', checkScrollability);
        
        return () => {
          scrollContainer.removeEventListener('scroll', checkScrollability);
          window.removeEventListener('resize', checkScrollability);
        };
      }
    }, [data]);

    const handleScroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const scrollAmount = 200;
        const newScrollLeft = direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;
        
        scrollRef.current.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth'
        });
      }
    };

    return (
      <ListWrapper width={width} ref={ref}>
        <ListController theme={theme} neon={neon}>
          <NavigationButton
            type="button"
            theme={theme}
            neon={neon}
            position="left"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
          >
            <IoIosArrowDropleft className="icon" />
          </NavigationButton>

          <ScrollContainer ref={scrollRef}>
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
          </ScrollContainer>

          <NavigationButton
            type="button"
            theme={theme}
            neon={neon}
            position="right"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
          >
            <IoIosArrowDropright className="icon" />
          </NavigationButton>
        </ListController>
      </ListWrapper>
    );
  }
);

HorizontalList.displayName = 'HorizontalList';