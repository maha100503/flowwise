import React from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import { Brain } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { Label, Select, Input, cn } from '../ui';
import { CustomNode } from '../../types';
import { useTheme } from '../../ThemeContext';

const REGRESSION_ALGORITHMS = [
    { value: 'LinearRegression', label: 'Linear Regression' },
    { value: 'PolynomialRegression', label: 'Polynomial Regression' },
    { value: 'Ridge', label: 'Ridge (L2)' },
    { value: 'Lasso', label: 'Lasso (L1)' },
    { value: 'ElasticNet', label: 'Elastic Net' },
    { value: 'BayesianRidge', label: 'Bayesian Ridge' },
    { value: 'QuantileRegression', label: 'Quantile Regression' },
    { value: 'SVR', label: 'SVR' },
];

const CLASSIFICATION_ALGORITHMS = [
    { value: 'LogisticRegression', label: 'Logistic Regression' },
    { value: 'GaussianNB', label: 'Gaussian NB' },
    { value: 'MultinomialNB', label: 'Multinomial NB' },
    { value: 'BernoulliNB', label: 'Bernoulli NB' },
    { value: 'SGDClassifier', label: 'SGD Classifier' },
    { value: 'Perceptron', label: 'Perceptron' },
    { value: 'PassiveAggressive', label: 'Passive Aggressive' },
];

const DUAL_ALGORITHMS = [
    { value: 'SVM', label: 'SVM / SVR' },
    { value: 'DecisionTree', label: 'Decision Tree' },
    { value: 'RandomForest', label: 'Random Forest' },
    { value: 'KNN', label: 'KNN' },
    { value: 'GradientBoosting', label: 'Gradient Boosting' },
    { value: 'AdaBoost', label: 'AdaBoost' },
    { value: 'XGBoost', label: 'XGBoost' },
    { value: 'LightGBM', label: 'LightGBM' },
];

const ALL_ALGORITHMS = [...REGRESSION_ALGORITHMS, ...CLASSIFICATION_ALGORITHMS, ...DUAL_ALGORITHMS];
const TASK_ALGORITHMS = DUAL_ALGORITHMS.map(a => a.value);
const TREE_ALGORITHMS = ['RandomForest', 'GradientBoosting', 'AdaBoost', 'XGBoost', 'LightGBM'];
const LR_ALGORITHMS = ['GradientBoosting', 'AdaBoost', 'XGBoost', 'LightGBM'];

export const MLNode = ({ id, data, selected }: NodeProps<CustomNode>) => {
    const { theme } = useTheme();
    const { updateNodeData } = useReactFlow();
    const config = data.config || {};
    const algorithm = data.subType || config.algorithm || 'LinearRegression';

    const updateConfig = (key: string, value: any) => {
        updateNodeData(id, { config: { ...config, [key]: value } });
    };

    return (
        <BaseNode
            id={id}
            label={data.label}
            icon={Brain}
            selected={selected}
            accentColor="from-violet-400 to-purple-500"
            glowColor="bg-violet-500/20"
            className="border-violet-500/20"
            outputColor="bg-violet-400"
            inputColor="bg-violet-400"
            badge="ML"
        >
            <div>
                <Label>Algorithm</Label>
                <Select
                    value={algorithm}
                    onChange={(e) => updateNodeData(id, { subType: e.target.value, config: { ...config, algorithm: e.target.value } })}
                >
                    <optgroup label="Regression">
                        {REGRESSION_ALGORITHMS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </optgroup>
                    <optgroup label="Classification">
                        {CLASSIFICATION_ALGORITHMS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </optgroup>
                    <optgroup label="Both (pick task)">
                        {DUAL_ALGORITHMS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </optgroup>
                </Select>
            </div>

            {TASK_ALGORITHMS.includes(algorithm) && (
                <div>
                    <Label>Task</Label>
                    <div className="flex gap-1.5">
                        {['classification', 'regression'].map(t => (
                            <button
                                key={t}
                                onClick={() => updateConfig('task', t)}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all capitalize ${t === (config.task || 'classification')
                                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                    : cn(theme.inputBg, theme.nodeTextMuted, 'border', theme.inputBorder, 'hover:opacity-80')
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {TREE_ALGORITHMS.includes(algorithm) && (
                <div>
                    <Label>Trees / Estimators</Label>
                    <Input type="number" value={config.n_estimators || 100} onChange={(e) => updateConfig('n_estimators', e.target.value)} />
                </div>
            )}

            {LR_ALGORITHMS.includes(algorithm) && (
                <div>
                    <Label>Learning Rate</Label>
                    <Input type="number" step="0.01" value={config.learning_rate || 0.1} onChange={(e) => updateConfig('learning_rate', e.target.value)} />
                </div>
            )}

            {['Ridge', 'Lasso', 'ElasticNet'].includes(algorithm) && (
                <div>
                    <Label>Alpha (regularization)</Label>
                    <Input type="number" step="0.1" value={config.alpha || 1.0} onChange={(e) => updateConfig('alpha', e.target.value)} />
                </div>
            )}

            {algorithm === 'ElasticNet' && (
                <div>
                    <Label>L1 Ratio</Label>
                    <Input type="number" step="0.1" min="0" max="1" value={config.l1_ratio || 0.5} onChange={(e) => updateConfig('l1_ratio', e.target.value)} />
                </div>
            )}

            {algorithm === 'PolynomialRegression' && (
                <div>
                    <Label>Degree</Label>
                    <Input type="number" min="2" max="10" value={config.degree || 2} onChange={(e) => updateConfig('degree', e.target.value)} />
                </div>
            )}

            {algorithm === 'KNN' && (
                <div>
                    <Label>Neighbors (k)</Label>
                    <Input type="number" value={config.n_neighbors || 5} onChange={(e) => updateConfig('n_neighbors', e.target.value)} />
                </div>
            )}

            {['SVM', 'SVR'].includes(algorithm) && (
                <div>
                    <Label>Kernel</Label>
                    <Select value={config.kernel || 'rbf'} onChange={(e) => updateConfig('kernel', e.target.value)}>
                        {['rbf', 'linear', 'poly', 'sigmoid'].map(k => <option key={k} value={k}>{k}</option>)}
                    </Select>
                </div>
            )}

            <div className={cn('flex items-center justify-between text-[10px] px-1', theme.textMuted)}>
                <span className="font-mono">scikit-learn</span>
                <span className="text-violet-400 font-bold">● Ready</span>
            </div>
        </BaseNode>
    );
};
