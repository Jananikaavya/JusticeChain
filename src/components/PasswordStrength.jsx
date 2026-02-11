import { useEffect, useState } from "react";

const PasswordStrength = ({ password, onStrengthChange }) => {
  const [strength, setStrength] = useState("Weak");
  const [score, setScore] = useState(0);

  useEffect(() => {
    let s = 0;

    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    setScore(s);

    if (s <= 2) setStrength("Weak");
    else if (s <= 4) setStrength("Medium");
    else setStrength("Strong");

    onStrengthChange(strength);
  }, [password]);

  const getColor = () => {
    if (strength === "Weak") return "bg-red-500";
    if (strength === "Medium") return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-200 h-2 rounded">
        <div
          className={`${getColor()} h-2 rounded transition-all`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>

      <p className="text-sm mt-1">
        Strength:{" "}
        <span
          className={
            strength === "Weak"
              ? "text-red-600"
              : strength === "Medium"
              ? "text-yellow-600"
              : "text-green-600"
          }
        >
          {strength}
        </span>
      </p>

      <ul className="text-xs text-gray-600 mt-1 space-y-1">
        <li>• Min 8 characters</li>
        <li>• Upper & lower case</li>
        <li>• Number</li>
        <li>• Special character</li>
      </ul>
    </div>
  );
};

export default PasswordStrength;
