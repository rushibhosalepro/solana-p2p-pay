type LoaderProps = {
  size?: number;
};

const Loader = ({ size = 40 }: LoaderProps) => {
  return (
    <div className="w-full flex items-center justify-center p-4">
      <div
        className="animate-spin rounded-full border-2 border-t-transparent border-[#0f172a]"
        style={{ width: size, height: size }}
      ></div>
    </div>
  );
};

export default Loader;
