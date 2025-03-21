import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image, Rect } from "react-konva";
import useImage from "use-image";
import OpenSeadragon from "openseadragon";
import { ZoomIn, ZoomOut, Maximize, Grid, Ruler, Home } from "lucide-react";
import "./WholeSlideViewer.css";
import '../styles.css';

const WholeSlideImageViewer = () => {
  const [image, status] = useImage("whole_slide_image.png");
  const [detectionResults, setDetectionResults] = useState([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rulerVisible, setRulerVisible] = useState(false);
  const [measurement, setMeasurement] = useState(10);
  const [zoomLevel, setZoomLevel] = useState(2);
  const viewerRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    fetch("/data/output.json")
      .then((response) => response.json())
      .then((data) => {
        if (data && Array.isArray(data.detection_results)) {
          setDetectionResults(data.detection_results);
        } else {
          setDetectionResults([]);
          console.error("Invalid data format in output.json:", data);
        }
      })
      .catch((error) => {
        setDetectionResults([]);
        console.error("Error fetching detection results:", error);
      });
  }, []);
  useEffect(() => {
    if (image) {
      setPosition({ x: 400, y: 300 }); // Center the image
    }
  }, [image]); // Run when the image loads
  useEffect(() => {
    setTimeout(() => {
      if (!document.getElementById("openseadragon-viewer")) return;
  
      const viewer = OpenSeadragon({
        id: "openseadragon-viewer",
        tileSources: "https://openseadragon.github.io/example-images/duomo/duomo.dzi",
        showNavigator: true,
      });
  
      return () => viewer.destroy();
    }, 100);
  }, []);
  

  const handleZoomIn = () => setScale((prev) => prev * 1.1);
  const handleZoomOut = () => setScale((prev) => prev / 1.1);
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 400, y: 300 }); // Reset to center
  };
  
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const oldScale = scale;
    const newScale = e.evt.deltaY > 0 ? scale / scaleBy : scale * scaleBy;
  
    // Get mouse pointer position relative to stage
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
  
    // Calculate new position to maintain image centering
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
  
    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };
  
  const handleDragMove = (e) => {
    setPosition({ x: e.target.x(), y: e.target.y() });
  };
  const toggleRuler = () => {
    setRulerVisible(!rulerVisible);
  };
  const updateZoom = (level) => {
    setZoomLevel(level);
    viewerRef.current.viewport.zoomTo(level);
  };

  if (status === "loading") return <p className="text-center text-gray-500 text-lg">Loading image...</p>;
  if (status === "failed") return <p className="text-center text-red-500 text-lg">Failed to load image.</p>;

  return (
    <div className="flex w-screen h-screen font-poppins bg-gray-50">
      <aside className="w-1/4 bg-white p-6 border-r shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Findings</h2>
        <ul className="space-y-2">
          {detectionResults.map((result, index) => (
            <li key={index} className="p-3 bg-gray-100 rounded-lg shadow-sm cursor-pointer hover:bg-gray-200">
              {result.label}
            </li>
          ))}
        </ul>
      </aside>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Whole Slide Image Viewer</h1>
        <div className="toolbar">
          <button className="toolbar-btn" onClick={handleZoomIn}><ZoomIn size={20} /></button>
          <button className="toolbar-btn" onClick={handleZoomOut}><ZoomOut size={20} /></button>
          <button className="toolbar-btn"><Maximize size={20} /></button>
          <button className="toolbar-btn"><Grid size={20} /></button>
          <button className="toolbar-btn" onClick={toggleRuler}><Ruler size={20} /></button>
          <button className="toolbar-btn" onClick={handleReset}><Home size={20} /></button>
        </div>
        <div className="border rounded-lg shadow-md overflow-hidden">
          <Stage
            width={800}
            height={600}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable
            onWheel={handleWheel}
            onDragMove={handleDragMove}
            ref={stageRef}
          >
            <Layer>
              <Image image={image} width={800} height={600} />
              {detectionResults.map((result, index) => (
                <Rect
                  key={index}
                  x={result.x}
                  y={result.y}
                  width={result.width}
                  height={result.height}
                  stroke="red"
                  strokeWidth={2}
                />
              ))}
            </Layer>
          </Stage>
        </div>
        {rulerVisible && <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow">Measurement: {measurement} µm</div>}
      </main>
      
      <aside className="w-1/4 p-6 border-l bg-white shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Zoomed Out View</h2>
        <div id="openseadragon-viewer" className="w-full h-[200px]"></div>
      </aside>
    </div>
  );
};

export default WholeSlideImageViewer;
