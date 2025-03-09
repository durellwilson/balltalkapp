const React = require('react');

const mockSvg = () => React.createElement('Svg');
mockSvg.Circle = () => React.createElement('Circle');
mockSvg.Rect = () => React.createElement('Rect');
mockSvg.Path = () => React.createElement('Path');
mockSvg.Line = () => React.createElement('Line');
mockSvg.G = () => React.createElement('G');
mockSvg.Defs = () => React.createElement('Defs');
mockSvg.LinearGradient = () => React.createElement('LinearGradient');
mockSvg.Stop = () => React.createElement('Stop');
mockSvg.ClipPath = () => React.createElement('ClipPath');
mockSvg.Text = () => React.createElement('Text');
mockSvg.Svg = mockSvg;

module.exports = mockSvg; 