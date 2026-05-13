import React, { useState, useEffect } from 'react';
import { PageBlock, InfoLoreBlockContent } from '../../../../../../../models/Pages';
import { getInfoLores } from '../../../../../../../services/infoLoreService';

import { Search } from '../../../../../../../components/Generic/Search/Search';
import { BiSearchAlt } from 'react-icons/bi';
import {
  InfoContainer,
  InfoDisplay,
  InfoContent,
  InfoImage,
  InfoDetails,
  InfoTitle,
  InfoId,
} from './InfoLoreBlockEditor.style';

interface InfoLoreBlockEditorProps {
  block: PageBlock;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onUpdate: (content: InfoLoreBlockContent) => void;
}

export const InfoLoreBlockEditor: React.FC<InfoLoreBlockEditorProps> = ({
  block,
  theme,
  neon,
  onUpdate,
}) => {
  const content = (block.conteudo as InfoLoreBlockContent) || { idInfoLore: 0 };
  const [lores, setLores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLore, setSelectedLore] = useState<any>(null);

  useEffect(() => {
    const fetchLores = async () => {
      setLoading(true);
      try {
        const result = await getInfoLores(true); // apenas visiveis
        if (result.sucesso && result.infoLores) {
          setLores(result.infoLores);
          
          // Se já há um lore selecionado, recuperar seus dados
          if (content.idInfoLore) {
            const selected = result.infoLores.find(l => l.idinfoLore === content.idInfoLore);
            if (selected) {
              setSelectedLore(selected);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao buscar InfoLores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLores();
  }, []);

  const handleSelectLore = (loreId: number) => {
    const selected = lores.find(l => l.idinfoLore === loreId);
    if (selected) {
      setSelectedLore(selected);
      onUpdate({
        idInfoLore: loreId,
        titulo: selected.titulo,
        imagem: selected.imagem,
      });
    }
  };

  const filteredLores = lores.filter(l =>
    l.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <InfoContainer $isDark={theme === 'dark'}>
      <Search
        theme={theme}
        neon={neon}
        label="Buscar InfoLore"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<BiSearchAlt className="icon" />}
        iconSize={20}
        disabled={loading}
        suggestions={filteredLores.map(l => `${l.idinfoLore}|${l.titulo}`)}
        onSelectSuggestion={(suggestion) => {
          const id = Number(suggestion.split('|')[0]);
          handleSelectLore(id);
          setSearchTerm('');
        }}
        loading={loading}
      />

      {selectedLore && (
        <InfoDisplay $isDark={theme === 'dark'}>
          <InfoContent>
            {selectedLore.imagem && (
              <InfoImage
                src={selectedLore.imagem}
                alt={selectedLore.titulo}
              />
            )}
            <InfoDetails>
              <InfoTitle>
                {selectedLore.titulo}
              </InfoTitle>
              <InfoId>
                ID: {selectedLore.idinfoLore}
              </InfoId>
            </InfoDetails>
          </InfoContent>
        </InfoDisplay>
      )}
    </InfoContainer>
  );
};
