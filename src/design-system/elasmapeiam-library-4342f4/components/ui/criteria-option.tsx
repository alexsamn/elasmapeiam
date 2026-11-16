import {forwardRef} from "react";
import {CriteriaCheckbox,type CriteriaCheckboxProps} from "./criteria-checkbox";
export interface CriteriaOptionProps extends CriteriaCheckboxProps {}
/** Compatibility name for CriteriaCheckbox. */
export const CriteriaOption=forwardRef<HTMLInputElement,CriteriaOptionProps>((props,ref)=><CriteriaCheckbox ref={ref} {...props}/>);
