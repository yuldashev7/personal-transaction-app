import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

import { useColorSchemeName } from '@/shared/hooks/use-theme';
import { useReduceTransparency } from '@/shared/hooks/use-reduce-transparency';
import { Radius } from '@/shared/theme/layout';

import { SolidSurface, type SurfaceProps } from './surface-base';

const GLASS_SUPPORTED = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export type { SurfaceProps };

export function Surface(props: SurfaceProps) {
  const scheme = useColorSchemeName();
  const reduceTransparency = useReduceTransparency();

  if (props.variant !== 'glass' || !GLASS_SUPPORTED || reduceTransparency) {
    return <SolidSurface {...props} />;
  }

  const { radius = 'lg', style, variant: _variant, ...rest } = props;

  return (
    <GlassView colorScheme={scheme} style={[{ borderRadius: Radius[radius] }, style]} {...rest} />
  );
}
