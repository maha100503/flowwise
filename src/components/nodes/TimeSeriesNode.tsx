import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { TrendingUp } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const ALGORITHMS = ['ARIMA', 'SARIMA', 'SARIMAX', 'ExponentialSmoothing', 'MovingAverage', 'Decomposition'];

export const TimeSeriesNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();
    const config = data.config || {};
    const algorithm = data.subType || config.algorithm || 'ARIMA';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={TrendingUp}
            selected={selected}
            accentColor="from-cyan-400 to-blue-500"
            glowColor="bg-cyan-500/20"
            className="border-cyan-500/20"
            outputColor="bg-cyan-400"
            inputColor="bg-cyan-400"
            badge="TS"
        >
            <div>
                <Label>Algorithm</Label>
                <Select
                    value={algorithm}
                    onChange={(e) => updateNodeData(id, { subType: e.target.value, config: { ...config, algorithm: e.target.value } })}
                >
                    {ALGORITHMS.map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </Select>
            </div>

            {algorithm === 'ARIMA' && (
                <>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label>p (AR)</Label>
                            <Input type="number" value={config.p || 1} onChange={(e) => updateConfig('p', e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <Label>d (I)</Label>
                            <Input type="number" value={config.d || 1} onChange={(e) => updateConfig('d', e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <Label>q (MA)</Label>
                            <Input type="number" value={config.q || 0} onChange={(e) => updateConfig('q', e.target.value)} />
                        </div>
                    </div>
                </>
            )}

            {(algorithm === 'SARIMA' || algorithm === 'SARIMAX') && (
                <>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label>p</Label>
                            <Input type="number" value={config.p || 1} onChange={(e) => updateConfig('p', e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <Label>d</Label>
                            <Input type="number" value={config.d || 1} onChange={(e) => updateConfig('d', e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <Label>q</Label>
                            <Input type="number" value={config.q || 0} onChange={(e) => updateConfig('q', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label>P</Label>
                            <Input type="number" value={config.P || 1} onChange={(e) => updateConfig('P', e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <Label>D</Label>
                            <Input type="number" value={config.D || 1} onChange={(e) => updateConfig('D', e.target.value)} />
                        </div>
                        <div className="flex-1">
                            <Label>Q</Label>
                            <Input type="number" value={config.Q || 0} onChange={(e) => updateConfig('Q', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <Label>Seasonal Period</Label>
                        <Input type="number" value={config.seasonal_period || 12} onChange={(e) => updateConfig('seasonal_period', e.target.value)} />
                    </div>
                </>
            )}

            {algorithm === 'ExponentialSmoothing' && (
                <div>
                    <Label>Trend</Label>
                    <Select value={config.trend || 'add'} onChange={(e) => updateConfig('trend', e.target.value)}>
                        <option value="add">Additive</option>
                        <option value="mul">Multiplicative</option>
                        <option value="none">None</option>
                    </Select>
                </div>
            )}

            {algorithm === 'MovingAverage' && (
                <div>
                    <Label>Window Size</Label>
                    <Input type="number" value={config.window || 3} onChange={(e) => updateConfig('window', e.target.value)} placeholder="3" />
                </div>
            )}

            {algorithm === 'Decomposition' && (
                <>
                    <div>
                        <Label>Model</Label>
                        <Select value={config.model || 'additive'} onChange={(e) => updateConfig('model', e.target.value)}>
                            <option value="additive">Additive</option>
                            <option value="multiplicative">Multiplicative</option>
                        </Select>
                    </div>
                    <div>
                        <Label>Period</Label>
                        <Input type="number" value={config.period || ''} onChange={(e) => updateConfig('period', e.target.value)} placeholder="Auto-detect" />
                    </div>
                </>
            )}

            <div>
                <Label>Forecast Steps</Label>
                <Input type="number" value={config.forecast_steps || 5} onChange={(e) => updateConfig('forecast_steps', e.target.value)} placeholder="5" />
            </div>

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">statsmodels</span>
                <span className="text-cyan-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
