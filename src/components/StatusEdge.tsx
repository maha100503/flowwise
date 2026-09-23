import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
import { AlertCircle } from 'lucide-react';

export type EdgeStatus = 'idle' | 'running' | 'success' | 'error';

export interface StatusEdgeData {
  status?: EdgeStatus;
  [key: string]: unknown;
}

export const StatusEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const status = (data as StatusEdgeData)?.status || 'idle';

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const colorMap: Record<EdgeStatus, string> = {
    idle: '#64748b',
    running: '#f59e0b',
    success: '#10b981',
    error: '#ef4444',
  };

  const glowMap: Record<EdgeStatus, string> = {
    idle: 'none',
    running: '0 0 8px #f59e0b88',
    success: '0 0 6px #10b98188',
    error: '0 0 8px #ef444488',
  };

  const strokeColor = colorMap[status];
  const animated = status === 'idle' || status === 'running';

  return (
    <>
      {/* Glow underlay for active states */}
      {status !== 'idle' && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: strokeColor,
            strokeWidth: 6,
            opacity: 0.25,
            filter: `blur(3px)`,
          }}
        />
      )}

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: status === 'idle' ? 1.5 : 2.5,
          filter: `drop-shadow(${glowMap[status]})`,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          ...(animated ? { strokeDasharray: '6 4', animation: 'edgeFlow 0.6s linear infinite' } : {}),
        }}
      />

      {/* Error icon on edge */}
      {status === 'error' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 shadow-lg shadow-red-500/40"
            title="Execution error on this connection"
          >
            <AlertCircle size={12} className="text-white" />
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Running pulse dot */}
      {status === 'running' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50"
          />
        </EdgeLabelRenderer>
      )}

      {/* Success checkmark */}
      {status === 'success' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
