import React, { useState } from "react";
import clsx from "clsx";
import useEventCallback from "./utils/useEventCallback";
import useEnhancedEffect from "./utils/useEnhancedEffect";

type RippleProps = {
  /**
   * Override or extend the styles applied to the component.
   */
  classes: Record<string, string>;
  className?: string;
  /**
   * @ignore - injected from TransitionGroup
   */
  in?: boolean;
  /**
   * @ignore - injected from TransitionGroup
   */
  onExited?: () => void;
  /**
   * If `true`, the ripple pulsates, typically indicating the keyboard focus state of an element.
   */
  pulsate?: boolean;
  /**
   * Diameter of the ripple.
   */
  rippleSize?: number;
  /**
   * Horizontal position of the ripple center.
   */
  rippleX?: number;
  /**
   * Vertical position of the ripple center.
   */
  rippleY?: number;
  /**
   * exit delay
   */
  timeout: number;
};

const Ripple: React.FC<RippleProps> = (props) => {
  const {
    className,
    classes,
    pulsate = false,
    rippleX,
    rippleY,
    rippleSize,
    in: inProp,
    onExited = () => {},
    timeout,
  } = props;

  const [leaving, setLeaving] = useState(false);

  const rippleClassName = clsx(
    className,
    classes.ripple,
    classes.rippleVisible,
    {
      [classes.ripplePulsate]: pulsate,
    }
  );

  const rippleStyles = {
    width: rippleSize,
    height: rippleSize,
    top: -(rippleSize / 2) + rippleY,
    left: -(rippleSize / 2) + rippleX,
  };

  const childClassName = clsx(classes.child, {
    [classes.childLeaving]: leaving,
    [classes.childPulsate]: pulsate,
  });

  const handleExited = useEventCallback(onExited);
  // Ripple is used for user feedback (e.g. click or press) so we want to apply styles with the highest priority
  useEnhancedEffect(() => {
    if (!inProp) {
      // react-transition-group#onExit
      setLeaving(true);

      // react-transition-group#onExited
      const timeoutId = setTimeout(handleExited, timeout);
      return () => {
        clearTimeout(timeoutId);
      };
    }
    return undefined;
  }, [handleExited, inProp, timeout]);

  return (
    <span className={rippleClassName} style={rippleStyles}>
      <span className={childClassName} />
    </span>
  );
};

export default Ripple;
