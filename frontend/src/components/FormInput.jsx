export default function FormInput({ 
  label, 
  type = "text", 
  name, 
  value, 
  onChange, 
  placeholder = "", 
  required = false, 
  disabled = false,
  rows,
  className = "" 
}) {
  const isTextarea = type === "textarea";
  
  const inputProps = {
    id: name,
    name,
    value,
    onChange,
    placeholder,
    disabled,
    required,
    className: ""
  };

  if (isTextarea) {
    inputProps.rows = rows || 5;
  } else {
    inputProps.type = type;
  }

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={name}>
        {label} {required && "*"}
      </label>
      {isTextarea ? (
        <textarea {...inputProps} />
      ) : (
        <input {...inputProps} />
      )}
    </div>
  );
}