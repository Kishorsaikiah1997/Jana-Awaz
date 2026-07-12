const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace everything from `i18n.language === 'gu' ?` down to `</div>                    )}`
const badStart = code.indexOf(`                       i18n.language === 'gu' ? '`);
const badEndStr = `                        )}
                      </div>
                    )}
`;
const badEnd = code.indexOf(badEndStr) + badEndStr.length;

if (badStart > -1 && badEnd > -1) {
  const goodCode = `                       i18n.language === 'gu' ? 'તમારી પોતાની ભાષામાં લખો અથવા બોલો।' :
                       i18n.language === 'kn' ? 'ನಿಮ್ಮ ಸ್ವಂತ ಭಾಷೆಯಲ್ಲಿ ಬರೆಯಿರಿ ಅಥವಾ ಮಾತನಾಡಿ।' :
                       i18n.language === 'ml' ? 'നിങ്ങളുടെ സ്വന്തം ഭാഷയിൽ എഴുതുകയോ സംസാരിക്കുകയോ ചെയ്യുക।' :
                       i18n.language === 'mr' ? 'तुमच्या स्वतःच्या भाषेत लिहा किंवा बोला।' :
                       i18n.language === 'or' ? 'ଆପଣଙ୍କ ନିଜ ଭାଷାରେ ଲେଖନ୍ତୁ କିମ୍ବା କୁହନ୍ତୁ।' :
                       i18n.language === 'pa' ? 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਲਿਖੋ ਜਾਂ ਬੋਲੋ।' :
                       i18n.language === 'ta' ? 'உங்கள் சொந்த மொழியில் எழுதுங்கள் அல்லது பேசுங்கள்।' :
                       i18n.language === 'te' ? 'మీ స్వంత భాషలో రాయండి లేదా మాట్లాడండి।' :
                       i18n.language === 'ur' ? 'اپنی زبان میں لکھیں یا بولیں۔' :
                       'Write or speak in your own language.'}
                    </p>
                    <div className="relative">
                      <textarea
                        value={isRecording && interimText ? \`\${text} \${interimText}\`.trim() : text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={String(t("What does your area need most? What would change your life?"))}
                        className={\`w-full min-h-[140px] rounded-2xl p-4 pb-12 text-base focus:outline-none transition resize-none \${
                          highContrast 
                            ? "bg-black border-yellow-400 border-2 text-yellow-400 placeholder:text-yellow-400/50" 
                            : "bg-[#FFFEF7] border border-[#C8B99A] focus:bg-white focus:border-[#FFB347] focus:ring-2 focus:ring-[#FFB347]/30 text-[#3E2723] placeholder-[#C8B99A]/80"
                        }\`}
                      />
                      
                      {/* Embedded Voice Controls inside Textarea */}
                      {voiceSupported && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          {isRecording ? (
                            <div className={\`flex items-center gap-2 rounded-full py-1.5 px-3 shadow-sm border animate-in fade-in zoom-in-95 duration-200 \${
                              highContrast ? "bg-black border-red-500 text-red-500" : "bg-red-50 border-red-100 text-red-600"
                            }\`}>
                              <div className="relative flex h-2.5 w-2.5 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-wider animate-pulse">
                                {recordingLanguage.startsWith('hi') ? "सुन रहा है..." : "Listening..."}
                              </span>
                              <div className="flex items-center gap-1 ml-1 border-l border-red-200 pl-2">
                                <button type="button" onClick={cancelRecording} className="p-1 hover:bg-red-100 rounded-full transition-colors" title="Cancel">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={stopRecording} className="p-1 hover:bg-red-100 rounded-full transition-colors" title="Done">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : isTranscribingVoice ? (
                            <div className={\`flex items-center gap-2 rounded-full py-1.5 px-3 shadow-sm border \${
                              highContrast ? "bg-black border-indigo-500 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                            }\`}>
                              <div className="animate-spin rounded-full h-3 w-3 border-[2px] border-current border-t-transparent"></div>
                              <span className="text-[11px] font-bold uppercase tracking-wider">
                                {recordingLanguage.startsWith('hi') ? "प्रक्रिया..." : "Processing..."}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select 
                                value={recordingLanguage}
                                onChange={(e) => setRecordingLanguage(e.target.value)}
                                className={\`text-[11px] font-medium rounded-full px-2 py-1.5 outline-none cursor-pointer border \${
                                  highContrast ? "bg-black text-yellow-400 border-yellow-400" : "bg-white/80 text-[#6B7280] border-[#E8DCC8] hover:bg-white"
                                }\`}
                                title="Voice typing language"
                              >
                                <option value="hi-IN">Hindi (हिंदी)</option>
                                <option value="en-IN">English</option>
                                <option value="bn-IN">Bengali (বাংলা)</option>
                                <option value="te-IN">Telugu (తెలుగు)</option>
                                <option value="mr-IN">Marathi (मराठी)</option>
                                <option value="ta-IN">Tamil (தமிழ்)</option>
                                <option value="ur-IN">Urdu (اردو)</option>
                                <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                                <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                                <option value="ml-IN">Malayalam (മലയാളം)</option>
                                <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
                                <option value="as-IN">Assamese (অসমীয়া)</option>
                                <option value="or-IN">Odia (ଓଡ଼ିଆ)</option>
                              </select>
                              <button
                                type="button"
                                onClick={startRecording}
                                className={\`p-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 \${
                                  highContrast
                                    ? "bg-yellow-400 text-black border-yellow-400"
                                    : "bg-gradient-to-r from-[#1A237E] to-[#283593] text-white"
                                }\`}
                                title={String(t("voice_typing"))}
                              >
                                <Mic className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
`;
  code = code.substring(0, badStart) + goodCode + code.substring(badEnd);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed!");
} else {
  console.log("Could not find boundaries");
}
