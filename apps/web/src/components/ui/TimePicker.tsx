"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
    placeholder?: string;
    disabled?: boolean;
    defaultTime?: string;
    icon?: React.ReactNode; // 繧ｫ繧ｹ繧ｿ繝繧｢繧､繧ｳ繝ｳ
}

/**
 * 繧ｫ繧ｹ繧ｿ繝譎る俣驕ｸ謚槭さ繝ｳ繝昴・繝阪Φ繝・(繝峨Λ繝繝ｭ繝ｼ繝ｫ鬚ｨ)
 * 
 * 譎る俣(HH)縺ｨ蛻・MM)繧偵◎繧後◇繧檎峡遶九＠縺ｦ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ驕ｸ謚槭〒縺阪ｋUI繧呈署萓帙＠縺ｾ縺吶・
 * 蛻・・5蛻・綾縺ｿ縺ｧ陦ｨ遉ｺ縺輔ｌ縺ｾ縺吶・
 */
export function TimePicker({ value, onChange, placeholder = "譎る俣繧帝∈謚・, disabled = false, defaultTime, icon }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLUListElement>(null);
    const minuteRef = useRef<HTMLUListElement>(null);

    // 譎る俣縺ｨ蛻・・驟榊・逕滓・
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

    // 迴ｾ蝨ｨ縺ｮ蛟､縺九ｉ譎る俣縺ｨ蛻・ｒ謚ｽ蜃ｺ・亥､縺後↑縺・ｴ蜷医・defaultTime縲√◎繧後ｂ縺ｪ縺代ｌ縺ｰ遨ｺ・・
    const [selectedHour, selectedMinute] = value
        ? value.split(":")
        : (defaultTime ? defaultTime.split(":") : ["", ""]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 繝｢繝ｼ繝繝ｫ縺碁幕縺・◆譎ゅ↓縲∫樟蝨ｨ驕ｸ謚槭＆繧後※縺・ｋ菴咲ｽｮ縺ｾ縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
    useEffect(() => {
        if (isOpen) {
            // 譎る俣縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ隱ｿ謨ｴ
            if (selectedHour && hourRef.current) {
                const hourIndex = hours.indexOf(selectedHour);
                if (hourIndex !== -1) {
                    hourRef.current.scrollTop = hourIndex * 32 - 64; // 荳ｭ螟ｮ縺ｫ陦ｨ遉ｺ縺輔ｌ繧九ｈ縺・↓隱ｿ謨ｴ
                }
            }
            // 蛻・・繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ隱ｿ謨ｴ
            if (selectedMinute && minuteRef.current) {
                const minuteIndex = minutes.indexOf(selectedMinute);
                if (minuteIndex !== -1) {
                    minuteRef.current.scrollTop = minuteIndex * 32 - 64;
                }
            }
        }
    }, [isOpen, selectedHour, selectedMinute]);

    const handleHourChange = (h: string) => {
        const m = selectedMinute || "00";
        onChange(`${h}:${m}`);
    };

    const handleMinuteChange = (m: string) => {
        const h = selectedHour || "00";
        onChange(`${h}:${m}`);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full flex items-center space-x-2 bg-gray-50 p-2 rounded-lg text-sm outline-none transition-colors
          ${isOpen ? "ring-2 ring-blue-100 bg-white" : disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}
        `}
            >
                {icon || <Clock size={18} className="text-gray-500" />}
                <span className={value ? "text-gray-700" : "text-gray-400"}>
                    {value || placeholder}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex h-48">
                        {/* 譎る俣 (Hours) 繧ｫ繝ｩ繝 */}
                        <div className="flex-1 border-r border-gray-100 relative">
                            <div className="sticky top-0 bg-gray-50 text-xs text-center py-1 text-gray-500 font-bold z-10">譎・/div>
                            <ul ref={hourRef} className="h-full overflow-y-auto scrollbar-hide py-16">
                                {hours.map((h) => (
                                    <li key={h} className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleHourChange(h)}
                                            className={`
                        w-full py-1 text-sm transition-colors
                        ${h === selectedHour ? "text-blue-600 font-bold scale-110" : "text-gray-400 hover:text-gray-600"}
                      `}
                                        >
                                            {h}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 蛻・(Minutes) 繧ｫ繝ｩ繝 */}
                        <div className="flex-1 relative">
                            <div className="sticky top-0 bg-gray-50 text-xs text-center py-1 text-gray-500 font-bold z-10">蛻・/div>
                            <ul ref={minuteRef} className="h-full overflow-y-auto scrollbar-hide py-16">
                                {minutes.map((m) => (
                                    <li key={m} className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleMinuteChange(m)}
                                            className={`
                        w-full py-1 text-sm transition-colors
                        ${m === selectedMinute ? "text-blue-600 font-bold scale-110" : "text-gray-400 hover:text-gray-600"}
                      `}
                                        >
                                            {m}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 荳ｭ螟ｮ縺ｮ繝上う繝ｩ繧､繝医ヰ繝ｼ・郁ｦ冶ｦ夂噪繧ｬ繧､繝会ｼ・*/}
                        <div className="absolute top-1/2 left-0 right-0 h-8 -mt-4 bg-blue-50 -z-10 pointer-events-none opacity-50" />
                    </div>
                </div>
            )}
        </div>
    );
}
