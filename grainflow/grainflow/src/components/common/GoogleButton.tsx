import googleLogo from '../../assets/icon-google-logo.svg';

const GoogleButton = ({ label }: { label: string }) => {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all mt-4"
    >
      <img 
        src={googleLogo}
        alt="Google" 
        className="w-5 h-5" 
      />
      {label}
    </button>
  );
};

export default GoogleButton;