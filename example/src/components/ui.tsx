import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Corners() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}

export function Card(props: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="card">
      <Corners />
      <h2>{props.title}</h2>
      {props.description && <p className="card-desc">{props.description}</p>}
      {props.children}
    </div>
  );
}

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      {props.children}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

export function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={props.type ?? "button"}
      className={`btn${props.variant === "secondary" ? " secondary" : ""}`}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

export function Badge(props: { children: ReactNode; tone?: "good" | "bad" }) {
  return <span className={`badge${props.tone ? ` ${props.tone}` : ""}`}>{props.children}</span>;
}
