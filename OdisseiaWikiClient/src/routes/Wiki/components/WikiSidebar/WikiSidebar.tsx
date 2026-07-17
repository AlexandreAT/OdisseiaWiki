import React, { useEffect, useState } from 'react';
import { BiChevronDown, BiChevronLeft } from 'react-icons/bi';
import { useSidebarNavigation } from '../../hooks';
import { WikiSidebarProps } from './types';
import {
  SidebarWrapper,
  SidebarInner,
  SidebarContent,
  SectionWrapper,
  SectionHeader,
  SectionItems,
  SectionItem,
  SectionItemContainer,
  EmptySidebarMessage,
  ToggleSidebarButton,
} from './WikiSidebar.style';

interface WikiSidebarInternalProps extends WikiSidebarProps {
  onToggle?: (expanded: boolean) => void;
  headerExpanded?: boolean;
  sidebarExpanded?: boolean;
}

export const WikiSidebar: React.FC<WikiSidebarInternalProps> = ({ page, onToggle, headerExpanded = true, sidebarExpanded: externalExpanded }) => {
  const { sections, scrollToTarget } = useSidebarNavigation(page);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(s => s.expanded).map(s => s.title))
  );
  const [localExpanded, setLocalExpanded] = useState(true);
  
  // Use external state if provided, otherwise fall back to local state
  const sidebarExpanded = externalExpanded !== undefined ? externalExpanded : localExpanded;
  const setSidebarExpanded = externalExpanded !== undefined
    ? (value: boolean) => { if (onToggle) onToggle(value); }
    : setLocalExpanded;

  useEffect(() => {
    setExpandedSections(new Set(
      sections.filter(section => section.expanded).map(section => section.title)
    ));
  }, [sections]);

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  const handleBlockClick = (targetId: string) => {
    scrollToTarget(targetId);
    if (window.innerWidth <= 768) setSidebarExpanded(false);
  };

  const handleToggleSidebar = () => {
    const newState = !sidebarExpanded;
    setSidebarExpanded(newState);
  };

  if (!page || sections.length === 0) {
    return (
      <SidebarWrapper $expanded={sidebarExpanded} $headerExpanded={headerExpanded}>
        <SidebarInner $headerExpanded={headerExpanded} $expanded={sidebarExpanded}>
          <ToggleSidebarButton
            onClick={handleToggleSidebar}
            title={sidebarExpanded ? 'Esconder sidebar' : 'Mostrar sidebar'}
            $isExpanded={sidebarExpanded}
            aria-label={sidebarExpanded ? 'Fechar navegação da Wiki' : 'Abrir navegação da Wiki'}
          >
            <BiChevronLeft />
          </ToggleSidebarButton>
          {sidebarExpanded && <EmptySidebarMessage>
            <p>Nenhuma navegação disponível para esta página</p>
          </EmptySidebarMessage>}
        </SidebarInner>
      </SidebarWrapper>
    );
  }

  return (
    <SidebarWrapper $expanded={sidebarExpanded} $headerExpanded={headerExpanded}>
      <SidebarInner $headerExpanded={headerExpanded} $expanded={sidebarExpanded}>
        <ToggleSidebarButton
          onClick={handleToggleSidebar}
          title={sidebarExpanded ? 'Esconder sidebar' : 'Mostrar sidebar'}
          $isExpanded={sidebarExpanded}
          aria-label={sidebarExpanded ? 'Fechar navegação da Wiki' : 'Abrir navegação da Wiki'}
        >
          <BiChevronLeft />
        </ToggleSidebarButton>

        {sidebarExpanded && (
          <SidebarContent>
            {sections.map(section => (
              <SectionWrapper key={section.title}>
                <SectionHeader
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={expandedSections.has(section.title)}
                >
                  <span>{section.title}</span>
                  <BiChevronDown />
                </SectionHeader>

                <SectionItems $expanded={expandedSections.has(section.title)}>
                  {section.blocks.map(block => (
                    <SectionItemContainer key={block.id}>
                      <SectionItem
                        onClick={() => handleBlockClick(block.targetId)}
                        title={block.title}
                        $level={block.level}
                      >
                        {block.title}
                      </SectionItem>
                    </SectionItemContainer>
                  ))}
                </SectionItems>
              </SectionWrapper>
            ))}
          </SidebarContent>
        )}
      </SidebarInner>
    </SidebarWrapper>
  );
};
