import sys

path = r'c:\Users\SFG DESIGN\Desktop\tour-mazex-pedition\src\sections\registry\sectionRegistry.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'return {};' in line and 'buildSectionProps' in "".join(lines[max(0, lines.index(line)-100):lines.index(line)]):
        new_lines.append('  if (section.type === "reviewWall") {\n')
        new_lines.append('    return {\n')
        new_lines.append('      variant: section.variant,\n')
        new_lines.append('    };\n')
        new_lines.append('  }\n\n')
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully updated sectionRegistry.jsx")
