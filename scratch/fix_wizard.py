import sys

path = r'c:\Users\SFG DESIGN\Desktop\tour-mazex-pedition\src\components\PlanMyTrip\PlanMyTripWizard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'contactPreference: "whatsapp",' in line:
        new_lines.append(line)
        new_lines.append('  referralCode: "",\n')
        continue
    
    if 'preferred contact method."' in line:
        new_lines.append(line)
        new_lines.append('\n')
        new_lines.append('                  <div className="space-y-1">\n')
        new_lines.append('                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">\n')
        new_lines.append('                      Referral Code (Optional)\n')
        new_lines.append('                    </label>\n')
        new_lines.append('                    <input \n')
        new_lines.append('                      type="text" \n')
        new_lines.append('                      value={formData.referralCode} \n')
        new_lines.append('                      onChange={(e) => setField("referralCode", e.target.value)} \n')
        new_lines.append('                      placeholder="e.g. SR-A1B2C" \n')
        new_lines.append('                      className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary uppercase" \n')
        new_lines.append('                    />\n')
        new_lines.append('                    <p className="ml-1 text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tight">\n')
        new_lines.append('                      Have a code from a friend? Enter it here to unlock rewards.\n')
        new_lines.append('                    </p>\n')
        new_lines.append('                  </div>\n')
        continue
        
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully updated PlanMyTripWizard.jsx")
