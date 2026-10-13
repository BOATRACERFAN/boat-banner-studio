import { createTemplate } from '../catalog/templates';
import type { Template } from '../catalog/templates';
import type { Racer } from '../types';
import { backgroundSvg, decorationSvg, svgUrl } from '../editor/artwork';
import { fontWeight } from '../lib/fonts';
// Catalog previews use the same project metadata and artwork as the editable scene.
export function TemplatePreview({ template, racer }: { template: Template; racer: Racer }) {
  const p = createTemplate(template, racer);
  return (
    <svg viewBox="0 0 960 192" width="100%" height="100%" aria-hidden="true">
      <image href={svgUrl(backgroundSvg(p.background))} width="960" height="192" />
      {p.layers.map((l) => (
        <g
          key={l.id}
          transform={`translate(${l.x} ${l.y}) rotate(${l.rotation}) scale(${l.scaleX} ${l.scaleY})`}
          opacity={l.opacity}
        >
          {l.type === 'decoration' ? (
            <image
              href={svgUrl(decorationSvg(l.assetId, l.color))}
              width={l.width}
              height={l.height}
            />
          ) : l.type === 'text' ? (
            <>
              <defs>
                <linearGradient
                  id={`grad-${l.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                  gradientUnits="objectBoundingBox"
                >
                  <stop stopColor={l.style.fill} />
                  <stop offset=".55" stopColor={l.style.gradient || l.style.fill} />
                  <stop offset="1" stopColor={l.style.fill} />
                </linearGradient>
              </defs>
              {!!l.style.outerWidth && (
                <text
                  x={l.align === 'center' ? l.width / 2 : l.align === 'right' ? l.width - 3 : 3}
                  y={(l.height + l.fontSize * 0.75) / 2}
                  fontSize={l.fontSize}
                  fontWeight={fontWeight(l.fontFamily)}
                  fontFamily={`"${l.fontFamily}", "Noto Sans JP", sans-serif`}
                  textAnchor={
                    l.align === 'center' ? 'middle' : l.align === 'right' ? 'end' : 'start'
                  }
                  letterSpacing={l.style.letterSpacing}
                  fill={l.style.fill}
                  stroke={l.style.outerStroke}
                  strokeWidth={(l.style.strokeWidth + l.style.outerWidth) * 2}
                  paintOrder="stroke fill"
                >
                  {l.text}
                </text>
              )}
              <text
                x={l.align === 'center' ? l.width / 2 : l.align === 'right' ? l.width - 3 : 3}
                y={(l.height + l.fontSize * 0.75) / 2}
                fontSize={l.fontSize}
                fontWeight={fontWeight(l.fontFamily)}
                fontFamily={`"${l.fontFamily}", "Noto Sans JP", sans-serif`}
                fontStyle={l.style.italic ? 'italic' : 'normal'}
                textAnchor={l.align === 'center' ? 'middle' : l.align === 'right' ? 'end' : 'start'}
                letterSpacing={l.style.letterSpacing}
                fill={l.style.gradient ? `url(#grad-${l.id})` : l.style.fill}
                stroke={l.style.stroke}
                strokeWidth={l.style.strokeWidth * 2}
                paintOrder="stroke fill"
                style={{
                  filter: `drop-shadow(${Math.cos((l.style.shadowAngle * Math.PI) / 180) * l.style.shadowDistance}px ${Math.sin((l.style.shadowAngle * Math.PI) / 180) * l.style.shadowDistance}px ${Math.max(l.style.shadowBlur, l.style.glow)}px ${l.style.shadowColor})`,
                }}
              >
                {l.text}
              </text>
            </>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
