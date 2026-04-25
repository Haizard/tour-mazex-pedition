import sys

path = r'c:\Users\SFG DESIGN\Desktop\tour-mazex-pedition\src\pages\AdminDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'import ReputationGuardianManager' in line:
        new_lines.append(line)
        new_lines.append('import RepeatCustomerManager from "../components/Admin/RepeatCustomerManager";\n')
    elif '{activeTab === "reputation" && <ReputationGuardianManager />}' in line:
        new_lines.append(line)
        new_lines.append('          {activeTab === "repeat-customers" && <RepeatCustomerManager />}\n')
    else:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully updated AdminDashboard.jsx with RepeatCustomerManager")
