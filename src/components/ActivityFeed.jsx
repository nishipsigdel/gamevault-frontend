import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    socket.on("activity:new", (data) => {
      setActivities((prev) => [data, ...prev].slice(0, 10)); // keep last 10
    });

    return () => {
      socket.off("activity:new");
    };
  }, []);

  if (activities.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
        🔴 Live Activity
      </h2>
      <ul className="space-y-2">
        {activities.map((a, i) => (
          <li key={i} className="text-sm text-gray-300 flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full shrink-0" />
            <span>
              <span className="text-white font-medium">{a.username}</span> uploaded{" "}
              <span className="text-brand-500">{a.title}</span> for{" "}
              <span className="text-gray-200">{a.game}</span>
            </span>
            <span className="ml-auto text-gray-600 text-xs shrink-0">
              {new Date(a.timestamp).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
