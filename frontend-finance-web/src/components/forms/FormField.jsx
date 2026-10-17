import React from "react";
import Input from "./Input";
import Select from "./Select";
import TextArea from "./TextArea";

const FormField = ({
  type = "text",
  label,
  name,
  value,
  onChange,
  error,
  options = [],
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const commonProps = {
    label,
    name,
    value,
    onChange,
    error,
    disabled,
    required,
    className,
    ...props,
  };

  switch (type) {
    case "select":
      return <Select options={options} placeholder={placeholder} {...commonProps} />;
    case "textarea":
      return <TextArea placeholder={placeholder} {...commonProps} />;
    default:
      return <Input type={type} placeholder={placeholder} {...commonProps} />;
  }
};

export default FormField;