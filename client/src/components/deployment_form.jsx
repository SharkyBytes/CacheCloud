import { useState, Fragment } from 'react';
import { Transition } from '@headlessui/react';

// --- Modern SVG Icons ---
const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);
const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);
const ContainerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);
const CheckCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

// --- Static Data ---
const DEPLOYMENT_OPTIONS = [
    { id: 'github', title: 'GitHub Repository', icon: <GithubIcon /> },
    { id: 'code', title: 'Source Code', icon: <CodeIcon /> },
    { id: 'container', title: 'Docker Container', icon: <ContainerIcon /> },
];

const LANGUAGE_OPTIONS = [
    { id: 'javascript', name: 'JavaScript' }, { id: 'python', name: 'Python' }, { id: 'go', name: 'Go' },
    { id: 'ruby', name: 'Ruby' }, { id: 'java', name: 'Java' }, { id: 'php', name: 'PHP' },
    { id: 'rust', name: 'Rust' }, { id: 'csharp', name: 'C#' },
];

// --- Reusable Form Components ---
const FormInput = ({ id, label, error, helpText, required, ...props }) => (
    <div className="group">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-2">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative">
            <input
                id={id}
                name={id}
                className={`block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset transition-all duration-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${error
                        ? 'ring-rose-300 focus:ring-rose-500 bg-rose-50'
                        : 'ring-slate-300 focus:ring-indigo-600 bg-white hover:ring-slate-400'
                    }`}
                {...props}
            />
        </div>
        {error && <p className="mt-2 text-sm text-rose-600 flex items-center"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</p>}
        {helpText && !error && <p className="mt-2 text-xs text-slate-500">{helpText}</p>}
    </div>
);

const GithubForm = ({ data, onChange, errors }) => (
    <div className="space-y-6">
        <FormInput id="githubUrl" label="GitHub Repository URL" value={data.githubUrl} onChange={onChange} error={errors.githubUrl} placeholder="https://github.com/username/repository" required />
        <FormInput id="buildCommand" label="Build Command" value={data.buildCommand} onChange={onChange} error={errors.buildCommand} placeholder="e.g., npm run build" helpText="Leave empty to auto-detect." />
        <FormInput id="installCommand" label="Install Command" value={data.installCommand} onChange={onChange} error={errors.installCommand} placeholder="e.g., npm install" helpText="Command to install dependencies." />
        <FormInput id="sourceDir" label="Source Directory" value={data.sourceDir} onChange={onChange} error={errors.sourceDir} placeholder="e.g., /src" helpText="The root directory of your app." />
    </div>
);


const RawCodeForm = ({ data, onChange, onFileUpload, errors }) => (
    <div className="space-y-6">
        <div>
            <label htmlFor="language" className="block text-sm font-semibold text-slate-700 mb-2">Language <span className="text-rose-500">*</span></label>
            <select id="language" name="language" value={data.language} onChange={onChange} className="block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm bg-white hover:ring-slate-400 transition-all duration-200">
                {LANGUAGE_OPTIONS.map((lang) => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="code" className="block text-sm font-semibold text-slate-700 mb-2">Code <span className="text-rose-500">*</span></label>
            <div className="mt-1">
                <div className="flex items-center space-x-4 mb-3">
                    <label className="inline-flex items-center px-4 py-2 border-0 rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 cursor-pointer transition-all duration-200 transform hover:scale-105">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        Upload File
                        <input type="file" onChange={onFileUpload} className="sr-only" />
                    </label>
                    <span className="text-sm text-slate-500">or paste your code below</span>
                </div>
                <textarea id="code" name="code" value={data.code} onChange={onChange} rows={12} className={`block w-full rounded-xl border-0 shadow-sm ring-1 ring-inset transition-all duration-200 p-4 font-mono text-sm ${errors.code ? 'ring-rose-300 focus:ring-rose-500 bg-rose-50' : 'ring-slate-300 focus:ring-indigo-600 bg-slate-50 hover:ring-slate-400'} focus:ring-2 focus:ring-inset placeholder:text-slate-400`} placeholder="// Paste your code here or upload a file above..." />
                {errors.code && <p className="mt-2 text-sm text-rose-600 flex items-center"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.code}</p>}
            </div>
        </div>
        <FormInput id="rawBuildCommand" label="Build Command" value={data.rawBuildCommand} onChange={onChange} error={errors.rawBuildCommand} placeholder="e.g., go build" helpText="Command to build your application (if required)." />
    </div>
);

const ContainerForm = ({ data, onChange, errors }) => (
    <div className="space-y-6">
        <FormInput id="imageUrl" label="Container Image URL" value={data.imageUrl} onChange={onChange} error={errors.imageUrl} placeholder="docker.io/username/image:tag" required />
        <FormInput id="command" label="Start Command" value={data.command} onChange={onChange} error={errors.command} placeholder="e.g., npm start" helpText="Overrides the container's default command." />
    </div>
);

// --- Main Deployment Form Component ---
export default function DeploymentForm() {
    const [selectedDeployId, setSelectedDeployId] = useState(DEPLOYMENT_OPTIONS[0].id);
    const [formData, setFormData] = useState({
        githubUrl: '', buildCommand: '', installCommand: '', sourceDir: '',
        language: LANGUAGE_OPTIONS[0].id, code: '', rawBuildCommand: '',
        imageUrl: '', command: '',
        envVars: [{ key: '', value: '' }],
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (selectedDeployId === 'github') {
            const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
            if (!formData.githubUrl) newErrors.githubUrl = 'GitHub URL is required';
            else if (!githubRegex.test(formData.githubUrl)) newErrors.githubUrl = 'Please enter a valid GitHub repository URL';
        } else if (selectedDeployId === 'code' && !formData.code) {
            newErrors.code = 'Code is required';
        } else if (selectedDeployId === 'container') {
            const containerRegex = /^[\w.-]+(\/[\w.-]+)*(:[a-zA-Z0-9_.-]+)?$/;
            if (!formData.imageUrl) newErrors.imageUrl = 'Container image URL is required';
            else if (!containerRegex.test(formData.imageUrl)) newErrors.imageUrl = 'Please enter a valid container image URL';
        }

        formData.envVars.forEach((env, index) => {
            if (env.key && !env.value) newErrors[`envValue-${index}`] = 'Value is required';
            if (!env.key && env.value) newErrors[`envKey-${index}`] = 'Key is required';
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEnvChange = (index, field, value) => {
        const newEnvVars = [...formData.envVars];
        newEnvVars[index][field] = value;
        if (index === newEnvVars.length - 1 && newEnvVars[index].key && newEnvVars[index].value) {
            newEnvVars.push({ key: '', value: '' });
        }
        setFormData(prev => ({ ...prev, envVars: newEnvVars }));
    };

    const removeEnvVar = (index) => {
        setFormData(prev => ({
            ...prev,
            envVars: prev.envVars.filter((_, i) => i !== index),
        }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setFormData(prev => ({ ...prev, code: event.target.result }));
        reader.readAsText(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);
        setErrors({});
        setIsSuccess(false);

        try {
            // Simulate API call
            console.log('Submitting data for:', selectedDeployId, formData);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (error) {
            setErrors({ submit: error.message || 'An unknown error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    const renderFormFields = () => {
        const formProps = { data: formData, onChange: handleChange, errors };
        switch (selectedDeployId) {
            case 'github': return <GithubForm {...formProps} />;
            case 'code': return <RawCodeForm {...formProps} onFileUpload={handleFileUpload} />;
            case 'container': return <ContainerForm {...formProps} />;
            default: return null;
        }
    };

    // --- MODERN BUTTON CLASSES ---
    const buttonStateClasses = isLoading
        ? 'bg-slate-400 cursor-not-allowed'
        : isSuccess
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 transform scale-105'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 focus:ring-indigo-500';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">Deploy Your Project</h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">Choose your deployment method and configure your project settings with our modern, streamlined interface.</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden border border-white/20">
                    <div className="p-10">
                        <form onSubmit={handleSubmit}>
                            {/* Modern Segmented Control for Deployment Method */}
                            <div className="mb-10">
                                <label className="block text-lg font-semibold text-slate-800 mb-4">Choose Deployment Method</label>
                                <div className="flex w-full bg-slate-100/50 p-2 rounded-2xl backdrop-blur-sm border border-slate-200/50">
                                    {DEPLOYMENT_OPTIONS.map(option => (
                                        <button
                                            type="button"
                                            key={option.id}
                                            onClick={() => setSelectedDeployId(option.id)}
                                            className={`flex-1 flex items-center justify-center text-sm font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform ${selectedDeployId === option.id
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105 shadow-indigo-500/25'
                                                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-800 hover:scale-102'
                                                }`}
                                        >
                                            <div className="mr-3">{option.icon}</div>
                                            {option.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Animated Form Section */}
                            <div className="relative">
                                <Transition
                                    as={Fragment}
                                    show={true}
                                    enter="transition-all duration-500 ease-out"
                                    enterFrom="opacity-0 transform translate-y-4"
                                    enterTo="opacity-100 transform translate-y-0"
                                    leave="transition-all duration-300 ease-in"
                                    leaveFrom="opacity-100 transform translate-y-0"
                                    leaveTo="opacity-0 transform translate-y-4"
                                >
                                    <div className="bg-gradient-to-br from-slate-50/50 to-white/50 rounded-2xl p-8 border border-slate-200/50 backdrop-blur-sm">
                                        <div className="space-y-8">
                                            {renderFormFields()}
                                        </div>
                                    </div>
                                </Transition>
                            </div>


                            {/* Environment Variables Section */}
                            <div className="mt-12 pt-8 border-t border-slate-200/60">
                                <div className="flex items-center mb-6">
                                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg mr-3">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800">Environment Variables</h3>
                                </div>
                                <div className="space-y-4">
                                    {formData.envVars.map((env, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-slate-200/50 backdrop-blur-sm hover:shadow-md transition-all duration-200">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 flex-grow">
                                                <FormInput id={`envKey-${index}`} value={env.key} onChange={(e) => handleEnvChange(index, 'key', e.target.value)} placeholder="VARIABLE_NAME" error={errors[`envKey-${index}`]} />
                                                <FormInput id={`envValue-${index}`} value={env.value} onChange={(e) => handleEnvChange(index, 'value', e.target.value)} placeholder="variable_value" error={errors[`envValue-${index}`]} />
                                            </div>
                                            {index < formData.envVars.length - 1 && (
                                                <button type="button" onClick={() => removeEnvVar(index)} className="p-3 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-all duration-200 transform hover:scale-110">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modern Submit Button */}
                            <div className="mt-12 pt-8 border-t border-slate-200/60">
                                <button type="submit" disabled={isLoading || isSuccess} className={`group relative w-full flex justify-center items-center px-8 py-4 border-0 text-lg font-semibold rounded-2xl shadow-xl text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500/50 ${buttonStateClasses}`}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex items-center">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Deploying Your Project...</span>
                                            </>
                                        ) : isSuccess ? (
                                            <>
                                                <CheckCircleIcon className="-ml-1 mr-3 h-6 w-6" />
                                                <span>🎉 Deployment Successful!</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Deploy Project
                                            </>
                                        )}
                                    </div>
                                </button>
                                <p className="text-center text-sm text-slate-500 mt-4">Your project will be deployed to our secure cloud infrastructure</p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}