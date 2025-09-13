    import { useState, Fragment } from 'react';
    import { Transition } from '@headlessui/react';

    // --- SVG Icons ---
    const GithubIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
    const CodeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    );
    const ContainerIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 0v10l8 4m0-14L4 7" />
        </svg>
    );
    const CheckCircleIcon = ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );

    // --- Static Data ---
    const DEPLOYMENT_OPTIONS = [
        { id: 'github', title: 'GitHub', icon: <GithubIcon /> },
        { id: 'code', title: 'Raw Code', icon: <CodeIcon /> },
        { id: 'container', title: 'Container Image', icon: <ContainerIcon /> },
    ];

    const LANGUAGE_OPTIONS = [
        { id: 'javascript', name: 'JavaScript' }, { id: 'python', name: 'Python' }, { id: 'go', name: 'Go' },
        { id: 'ruby', name: 'Ruby' }, { id: 'java', name: 'Java' }, { id: 'php', name: 'PHP' },
        { id: 'rust', name: 'Rust' }, { id: 'csharp', name: 'C#' },
    ];

    // --- Reusable Form Components ---
    const FormInput = ({ id, label, error, helpText, required, ...props }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1">
                <input
                    id={id}
                    name={id}
                    className={`block w-full rounded-md shadow-sm sm:text-sm px-3 py-2 bg-gray-50 border ${error ? 'border-red-400' : 'border-gray-300'} focus:border-green-500 focus:ring-green-500`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
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
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">Language <span className="text-red-500">*</span></label>
                <select id="language" name="language" value={data.language} onChange={onChange} className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2">
                    {LANGUAGE_OPTIONS.map((lang) => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></label>
                <div className="mt-1">
                    <div className="flex items-center space-x-4 mb-2">
                        <label className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                            <span>Upload File</span>
                            <input type="file" onChange={onFileUpload} className="sr-only" />
                        </label>
                        <span className="text-sm text-gray-500">or paste your code below</span>
                    </div>
                    <textarea id="code" name="code" value={data.code} onChange={onChange} rows={10} className={`block w-full rounded-md border bg-gray-50 ${errors.code ? 'border-red-400' : 'border-gray-300'} shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-3 font-mono`} placeholder="// Your code here..." />
                    {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
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
        
        // --- UPDATED CLASSES ---
        const buttonStateClasses = isLoading 
            ? 'bg-green-400 cursor-not-allowed' 
            : isSuccess 
            ? 'bg-emerald-500' // Changed to emerald so it's a bit different from the default green
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                <div className="w-full max-w-3xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Deploy Your New Project</h1>
                        <p className="text-gray-500 mt-2">Choose your deployment method and configure your project settings.</p>
                    </div>

                    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={handleSubmit}>
                                {/* Segmented Control for Deployment Method */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Deployment Method</label>
                                    <div className="flex w-full bg-gray-100 p-1 rounded-lg">
                                        {DEPLOYMENT_OPTIONS.map(option => (
                                            <button
                                                type="button"
                                                key={option.id}
                                                onClick={() => setSelectedDeployId(option.id)}
                                                className={`flex-1 flex items-center justify-center text-sm font-medium py-2 rounded-md transition-all duration-200 ${
                                                    selectedDeployId === option.id
                                                        ? 'bg-white text-green-700 shadow' // <-- UPDATED
                                                        : 'text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {option.icon}
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
                                        enter="transition-opacity duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="transition-opacity duration-150"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="space-y-6">
                                            {renderFormFields()}
                                        </div>
                                    </Transition>
                                </div>


                                {/* Environment Variables Section */}
                                <div className="mt-10 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Environment Variables</h3>
                                    <div className="space-y-3">
                                        {formData.envVars.map((env, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 flex-grow">
                                                    <FormInput id={`envKey-${index}`} value={env.key} onChange={(e) => handleEnvChange(index, 'key', e.target.value)} placeholder="KEY" error={errors[`envKey-${index}`]} />
                                                    <FormInput id={`envValue-${index}`} value={env.value} onChange={(e) => handleEnvChange(index, 'value', e.target.value)} placeholder="VALUE" error={errors[`envValue-${index}`]} />
                                                </div>
                                                {index < formData.envVars.length - 1 && (
                                                    <button type="button" onClick={() => removeEnvVar(index)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="mt-10 pt-6 border-t border-gray-200">
                                    <button type="submit" disabled={isLoading || isSuccess} className={`w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonStateClasses}`}>
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span>Deploying...</span>
                                            </>
                                        ) : isSuccess ? (
                                            <>
                                                <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                                                <span>Deployment Successful!</span>
                                            </>
                                        ) : (
                                            'Deploy Project'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }