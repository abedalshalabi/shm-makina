import { useState, useEffect, useRef } from "react";
import { Users, Eye } from "lucide-react";
import { analyticsAPI, settingsAPI } from "../services/api";

const VisitorCounter = () => {
    const [count, setCount] = useState<number | null>(null);
    const [showCounter, setShowCounter] = useState<boolean | null>(null);
    const hasTracked = useRef(false);

    useEffect(() => {
        // Prevent double execution in React StrictMode
        if (hasTracked.current) return;
        hasTracked.current = true;

        const initCounter = async () => {
            try {
                // 1. Fetch visibility setting first
                const settings = await settingsAPI.getSettings('analytics');
                const settingsData = settings.data || settings;

                const canShow = settingsData?.show_visitor_counter === "1" ||
                    settingsData?.show_visitor_counter === 1 ||
                    settingsData?.show_visitor_counter === true ||
                    settingsData?.show_visitor_counter === "true";

                setShowCounter(!!canShow);

                if (canShow) {
                    // 2. Only track and get count if enabled
                    const isSessionTracked = sessionStorage.getItem("visit_tracked") === "true";
                    const response = await analyticsAPI.trackVisit(isSessionTracked);

                    // Handle different response structures
                    const resultCount = response.count !== undefined ? response.count : (response.data?.count);

                    if (resultCount !== undefined && resultCount !== null) {
                        setCount(Number(resultCount));
                    } else {
                        setCount(0); // Fallback to 0 if count is missing
                    }

                    if (!isSessionTracked) {
                        sessionStorage.setItem("visit_tracked", "true");
                    }
                }
            } catch (error) {
                console.error("Failed to initialize visitor counter:", error);
                setShowCounter(false);
            }
        };

        initCounter();
    }, []);

    // Only hide if we explicitly know it should be hidden
    if (showCounter === false) return null;

    // Show 0 or actual count
    const displayCount = count || 0;

    return (
        <div className="fixed bottom-24 right-6 z-40 group">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-3 flex items-center gap-3 transform transition-all duration-300 hover:scale-105 hover:bg-white">
                <div className="bg-emerald-600 p-2 rounded-xl">
                    <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium leading-none">إجمالي الزوار</span>
                    <span className="text-lg font-bold text-gray-800 leading-tight">
                        {displayCount.toLocaleString()}
                    </span>
                </div>

                {/* Tooltip style detail */}
                <div className="absolute right-0 bottom-full mb-2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    شكراً لزيارتكم!
                </div>
            </div>
        </div>
    );
};

export default VisitorCounter;
