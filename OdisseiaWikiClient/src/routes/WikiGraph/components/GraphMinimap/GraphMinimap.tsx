import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { BiMinus, BiPlus, BiTargetLock } from 'react-icons/bi';
import type { Core, NodeSingular } from 'cytoscape';
import { HudFrame } from '../../../../components/Generic/HudFrame';
import {
  MiniMapCanvas,
  MiniMapControls,
  MiniMapTitle,
  MiniMapWrapper,
} from './GraphMinimap.style';

interface GraphMinimapProps {
  cy: Core;
  neon: boolean;
  onCentralize: () => void;
}

interface MiniMapTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

interface MiniMapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PointerNavigation {
  pointerId: number;
  anchorX: number;
  anchorY: number;
}

const EMPTY_TRANSFORM: MiniMapTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  width: 1,
  height: 1,
};

const EMPTY_VIEWPORT: MiniMapRect = { x: 0, y: 0, width: 0, height: 0 };

const nodeColors: Record<string, string> = {
  city: '#ffe45e',
  page: '#4edbff',
  character: '#ff4fd8',
  race: '#68ffad',
};

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
);

export const GraphMinimap = ({ cy, neon, onCentralize }: GraphMinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<MiniMapTransform>(EMPTY_TRANSFORM);
  const viewportRectRef = useRef<MiniMapRect>(EMPTY_VIEWPORT);
  const pointerNavigationRef = useRef<PointerNavigation | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || cy.destroyed()) return;

    const cssWidth = Math.max(canvas.clientWidth, 1);
    const cssHeight = Math.max(canvas.clientHeight, 1);
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);
    const targetWidth = Math.max(Math.round(cssWidth * pixelRatio), 1);
    const targetHeight = Math.max(Math.round(cssHeight * pixelRatio), 1);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);

    const nodes = cy.nodes();
    if (nodes.empty()) {
      transformRef.current = { ...EMPTY_TRANSFORM, width: cssWidth, height: cssHeight };
      viewportRectRef.current = EMPTY_VIEWPORT;
      return;
    }

    const bounds = cy.elements().boundingBox({
      includeLabels: false,
      includeOverlays: false,
      includeUnderlays: false,
    });
    if (![bounds.x1, bounds.y1, bounds.w, bounds.h].every(Number.isFinite)) return;

    const padding = Math.max(8, Math.min(cssWidth, cssHeight) * 0.07);
    const graphWidth = Math.max(bounds.w, 1);
    const graphHeight = Math.max(bounds.h, 1);
    const availableWidth = Math.max(cssWidth - padding * 2, 1);
    const availableHeight = Math.max(cssHeight - padding * 2, 1);
    const scale = Math.max(Math.min(availableWidth / graphWidth, availableHeight / graphHeight), 0.0001);
    const offsetX = (cssWidth - graphWidth * scale) / 2 - bounds.x1 * scale;
    const offsetY = (cssHeight - graphHeight * scale) / 2 - bounds.y1 * scale;

    transformRef.current = {
      scale,
      offsetX,
      offsetY,
      width: cssWidth,
      height: cssHeight,
    };

    const toMini = (position: { x: number; y: number }) => ({
      x: position.x * scale + offsetX,
      y: position.y * scale + offsetY,
    });

    context.save();
    context.lineCap = 'round';
    context.lineWidth = neon ? 0.9 : 0.75;
    context.strokeStyle = neon
      ? 'rgba(71, 219, 255, 0.5)'
      : 'rgba(102, 190, 220, 0.34)';

    cy.edges().forEach((edge) => {
      const source = toMini(edge.source().position());
      const target = toMini(edge.target().position());
      if (![source.x, source.y, target.x, target.y].every(Number.isFinite)) return;

      context.beginPath();
      context.moveTo(source.x, source.y);
      context.lineTo(target.x, target.y);
      context.stroke();
    });

    cy.nodes().forEach((node: NodeSingular) => {
      const point = toMini(node.position());
      if (![point.x, point.y].every(Number.isFinite)) return;

      const hidden = Boolean(node.data('hidden'));
      const entityType = String(node.data('entityType') ?? '');
      const central = node.hasClass('is-central');
      const radius = central ? 4.6 : hidden ? 2.4 : 3.1;

      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fillStyle = hidden ? '#07111f' : nodeColors[entityType] ?? '#47dbff';
      context.fill();

      if (hidden || central) {
        context.lineWidth = central ? 1.4 : 0.8;
        context.strokeStyle = central ? '#ffffff' : 'rgba(71, 219, 255, 0.65)';
        context.stroke();
      }
    });
    context.restore();

    const extent = cy.extent();
    const topLeft = toMini({ x: extent.x1, y: extent.y1 });
    const bottomRight = toMini({ x: extent.x2, y: extent.y2 });
    const rawLeft = Math.min(topLeft.x, bottomRight.x);
    const rawTop = Math.min(topLeft.y, bottomRight.y);
    const rawRight = Math.max(topLeft.x, bottomRight.x);
    const rawBottom = Math.max(topLeft.y, bottomRight.y);
    const left = clamp(rawLeft, 0.75, Math.max(cssWidth - 0.75, 0.75));
    const top = clamp(rawTop, 0.75, Math.max(cssHeight - 0.75, 0.75));
    const right = clamp(rawRight, left, Math.max(cssWidth - 0.75, left));
    const bottom = clamp(rawBottom, top, Math.max(cssHeight - 0.75, top));
    const viewportRect = {
      x: left,
      y: top,
      width: Math.max(right - left, 0),
      height: Math.max(bottom - top, 0),
    };

    viewportRectRef.current = viewportRect;
    context.save();
    context.lineWidth = 1.5;
    context.strokeStyle = neon ? '#47dbff' : 'rgba(71, 219, 255, 0.88)';
    context.fillStyle = neon ? 'rgba(71, 219, 255, 0.11)' : 'rgba(71, 219, 255, 0.07)';
    context.fillRect(viewportRect.x, viewportRect.y, viewportRect.width, viewportRect.height);
    context.strokeRect(viewportRect.x, viewportRect.y, viewportRect.width, viewportRect.height);
    context.restore();
  }, [cy, neon]);

  useEffect(() => {
    const scheduleRender = () => {
      if (animationFrameRef.current !== null) return;
      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        render();
      });
    };

    const graphEvents = 'add remove data style viewport position layoutstop resize';
    cy.on(graphEvents, scheduleRender);

    const canvas = canvasRef.current;
    const resizeObserver = canvas && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleRender)
      : null;
    if (canvas) resizeObserver?.observe(canvas);
    window.addEventListener('resize', scheduleRender, { passive: true });
    scheduleRender();

    return () => {
      cy.off(graphEvents, scheduleRender);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleRender);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [cy, render]);

  const getCanvasPoint = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    return {
      x: (event.clientX - rect.left) * (canvas.clientWidth / rect.width),
      y: (event.clientY - rect.top) * (canvas.clientHeight / rect.height),
    };
  }, []);

  const getModelPoint = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvasPoint = getCanvasPoint(event);
    if (!canvasPoint) return null;

    const { scale, offsetX, offsetY } = transformRef.current;
    if (!Number.isFinite(scale) || scale <= 0) return null;

    return {
      canvasPoint,
      modelPoint: {
        x: (canvasPoint.x - offsetX) / scale,
        y: (canvasPoint.y - offsetY) / scale,
      },
    };
  }, [getCanvasPoint]);

  const panToModelCenter = useCallback((modelX: number, modelY: number) => {
    if (cy.destroyed() || !Number.isFinite(modelX) || !Number.isFinite(modelY)) return;

    const zoom = cy.zoom();
    cy.stop();
    cy.pan({
      x: cy.width() / 2 - modelX * zoom,
      y: cy.height() / 2 - modelY * zoom,
    });
  }, [cy]);

  const moveViewport = useCallback((
    event: ReactPointerEvent<HTMLCanvasElement>,
    navigation: PointerNavigation,
  ) => {
    const point = getModelPoint(event);
    if (!point) return;

    panToModelCenter(
      point.modelPoint.x - navigation.anchorX,
      point.modelPoint.y - navigation.anchorY,
    );
  }, [getModelPoint, panToModelCenter]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (cy.destroyed()) return;

    const point = getModelPoint(event);
    if (!point) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const viewport = viewportRectRef.current;
    const isInsideViewport = point.canvasPoint.x >= viewport.x
      && point.canvasPoint.x <= viewport.x + viewport.width
      && point.canvasPoint.y >= viewport.y
      && point.canvasPoint.y <= viewport.y + viewport.height;
    const extent = cy.extent();
    const currentCenter = {
      x: (extent.x1 + extent.x2) / 2,
      y: (extent.y1 + extent.y2) / 2,
    };
    const navigation: PointerNavigation = {
      pointerId: event.pointerId,
      anchorX: isInsideViewport ? point.modelPoint.x - currentCenter.x : 0,
      anchorY: isInsideViewport ? point.modelPoint.y - currentCenter.y : 0,
    };

    pointerNavigationRef.current = navigation;
    if (!isInsideViewport) moveViewport(event, navigation);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const navigation = pointerNavigationRef.current;
    if (!navigation || navigation.pointerId !== event.pointerId) return;

    event.preventDefault();
    moveViewport(event, navigation);
  };

  const finishPointerNavigation = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerNavigationRef.current?.pointerId !== event.pointerId) return;
    pointerNavigationRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const changeZoom = (factor: number) => {
    const nextZoom = Math.min(cy.maxZoom(), Math.max(cy.minZoom(), cy.zoom() * factor));
    cy.zoom({
      level: nextZoom,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  };

  return (
    <MiniMapWrapper>
      <HudFrame neon={neon} aria-label="Minimapa da Teia de Conexões">
        <MiniMapTitle>Minimapa</MiniMapTitle>
        <MiniMapCanvas
          ref={canvasRef}
          aria-label="Navegar pelo minimapa da teia"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerNavigation}
          onPointerCancel={finishPointerNavigation}
          onLostPointerCapture={() => { pointerNavigationRef.current = null; }}
        />
        <MiniMapControls>
          <button type="button" onClick={() => changeZoom(1.2)} aria-label="Aproximar grafo">
            <BiPlus />
          </button>
          <button type="button" onClick={() => changeZoom(0.82)} aria-label="Afastar grafo">
            <BiMinus />
          </button>
          <button type="button" onClick={onCentralize} aria-label="Centralizar grafo">
            <BiTargetLock />
          </button>
        </MiniMapControls>
      </HudFrame>
    </MiniMapWrapper>
  );
};
