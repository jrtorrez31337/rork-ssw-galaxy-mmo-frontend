const getApiBaseUrl = () => {
  return 'http://192.168.122.76:8080/v1';
};

export const config = {
  API_BASE_URL: getApiBaseUrl(),
} as const;

export const DEV_INSTRUCTIONS = `
⚠️ Backend Connection Issue

The app cannot connect to the backend server.

For development:
1. Find your local IP address:
   - Mac/Linux: Run 'ifconfig' and look for 'inet' under your network interface
   - Windows: Run 'ipconfig' and look for 'IPv4 Address'

2. Update constants/config.ts with your IP:
   - Example: 'http://192.168.1.100:8080/v1'

3. Make sure the backend is running on http://192.168.122.76:8080

4. Test connection: Visit http://192.168.122.76:8080/health in a browser
`;
