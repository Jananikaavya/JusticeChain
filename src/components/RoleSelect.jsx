import { useEffect, useState } from "react";

const RoleSelect = ({ password, onRoleChange, onRoleIdGenerate }) => {
  const [role, setRole] = useState("");
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    if (role && password.length >= 4) {
      const last4 = password.slice(-4);
      const generatedId = `${role}_${last4}`;
      setRoleId(generatedId);
      onRoleIdGenerate(generatedId);
    }
  }, [role, password]);

  const handleRole = (e) => {
    const selectedRole = e.target.value;
    setRole(selectedRole);
    onRoleChange(selectedRole);
  };

  return (
    <div className="space-y-2">
      <label className="font-semibold">Select Role</label>

      <select
        onChange={handleRole}
        className="w-full border rounded-lg p-2"
      >
        <option value="">-- Select Role --</option>
        <option value="ADMIN">Admin</option>
        <option value="POLICE">Police</option>
        <option value="FORENSIC">Forensic Officer</option>
        <option value="JUDGE">Judge</option>
      </select>

      {roleId && (
        <div className="bg-gray-100 p-2 rounded text-sm">
          <p className="font-semibold">Generated Role ID:</p>
          <p className="text-blue-600">{roleId}</p>
        </div>
      )}
    </div>
  );
};

export default RoleSelect;
