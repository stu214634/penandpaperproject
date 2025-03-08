import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Alert, 
  AlertTitle, 
  IconButton, 
  Tooltip, 
  CircularProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { AssetManager, AssetType } from '../services/assetManager';
import { useStore } from '../store';

interface AssetDropZoneProps {
  onAssetImport?: () => void;
  isFullPage?: boolean;
}

export const AssetDropZone: React.FC<AssetDropZoneProps> = ({ 
  onAssetImport,
  isFullPage = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we have any assets in IndexedDB
  const [hasStoredAssets, setHasStoredAssets] = useState(false);
  const [isCheckingAssets, setIsCheckingAssets] = useState(true);
  
  // State for individual asset tabs
  const [tabValue, setTabValue] = useState(0);
  const [audioAssets, setAudioAssets] = useState<string[]>([]);
  const [imageAssets, setImageAssets] = useState<string[]>([]);
  const [dataAssets, setDataAssets] = useState<string[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  
  // Get store methods for saving data
  const { saveDataToIndexedDB, exportToZip } = useStore();
  
  // Asset addition state
  const [currentAssetType, setCurrentAssetType] = useState<AssetType>('audio');
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);

  // Check for assets on component mount and load asset lists
  useEffect(() => {
    const checkAssets = async () => {
      setIsCheckingAssets(true);
      const hasAudio = await AssetManager.hasAssets('audio');
      const hasImages = await AssetManager.hasAssets('images');
      const hasData = await AssetManager.hasAssets('data');
      setHasStoredAssets(hasAudio || hasImages || hasData);
      setIsCheckingAssets(false);
      
      // Load asset lists
      await loadAssetLists();
    };
    
    checkAssets();
  }, []);
  
  // Load lists of assets for each type
  const loadAssetLists = async () => {
    setIsLoadingAssets(true);
    
    try {
      const audioAssets = await AssetManager.getAssets('audio');
      const imageAssets = await AssetManager.getAssets('images');
      const dataAssets = await AssetManager.getAssets('data');
      
      setAudioAssets(audioAssets.map(asset => asset.name));
      setImageAssets(imageAssets.map(asset => asset.name));
      setDataAssets(dataAssets.map(asset => asset.name));
      
      setIsLoadingAssets(false);
    } catch (error) {
      console.error('Error loading assets:', error);
      setIsLoadingAssets(false);
    }
  };
  
  // Additional help text for formatting requirements
  const helpText = `
Your zip file should contain:

1. /audio folder - with mp3, wav, or ogg files
2. /images folder - with jpg, png, or gif files
3. /data folder - with JSON files:
   - locations.json: Array of location objects with id, name, description
   - characters.json: Array of character objects

Example locations.json:
[
  {
    "id": "tavern",
    "name": "The Rusty Tankard",
    "description": "A cozy tavern with a fireplace.",
    "backgroundMusic": "tavern_ambience.mp3"
  }
]
  `;
  
  // Handle drag events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  // Process the dropped file
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    await processFile(file);
  };
  
  // Process the selected file
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    await processFile(file);
  };
  
  // Common file processing logic
  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setResult({
        success: false,
        message: 'Please upload a .zip file containing audio, images, and data folders.'
      });
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const result = await AssetManager.processZipFile(file);
      setResult(result);
      
      if (result.success) {
        setHasStoredAssets(true);
        // Reload asset lists
        await loadAssetLists();
        if (onAssetImport) {
          onAssetImport();
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error processing file: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle clearing all assets
  const handleClearAssets = async () => {
    setIsProcessing(true);
    
    try {
      await AssetManager.clearAllAssets();
      setHasStoredAssets(false);
      // Clear asset lists
      setAudioAssets([]);
      setImageAssets([]);
      setDataAssets([]);
      setResult({
        success: true,
        message: 'All imported assets have been cleared.'
      });
      
      if (onAssetImport) {
        onAssetImport();
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error clearing assets: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle closing the result alert
  const handleCloseAlert = () => {
    setResult(null);
  };
  
  // Create empty data structure for new users
  const handleCreateEmptyData = async () => {
    setIsProcessing(true);
    setResult(null);
    
    try {
      const result = await AssetManager.loadExampleData();
      setResult(result);
      
      if (result.success) {
        setHasStoredAssets(true);
        // Reload asset lists
        await loadAssetLists();
        if (onAssetImport) {
          onAssetImport();
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error creating empty structure: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle opening the add asset dialog
  const handleAddAssetClick = (type: AssetType) => {
    setCurrentAssetType(type);
    setIsAddAssetDialogOpen(true);
  };
  
  // Handle selecting a file for individual asset upload
  const handleSingleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    setIsProcessing(true);
    try {
      const result = await AssetManager.addAsset(currentAssetType, file);
      setResult(result);
      
      if (result.success) {
        setHasStoredAssets(true);
        // Reload asset lists
        await loadAssetLists();
        if (onAssetImport) {
          onAssetImport();
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error adding asset: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsProcessing(false);
      setIsAddAssetDialogOpen(false);
      if (singleFileInputRef.current) {
        singleFileInputRef.current.value = '';
      }
    }
  };
  
  // Handle deleting an individual asset
  const handleDeleteAsset = async (type: AssetType, name: string) => {
    setIsProcessing(true);
    try {
      const result = await AssetManager.deleteAsset(type, name);
      setResult(result);
      
      if (result.success) {
        // Reload asset lists
        await loadAssetLists();
        // Check if we still have assets
        const hasAudio = await AssetManager.hasAssets('audio');
        const hasImages = await AssetManager.hasAssets('images');
        const hasData = await AssetManager.hasAssets('data');
        setHasStoredAssets(hasAudio || hasImages || hasData);
        
        if (onAssetImport) {
          onAssetImport();
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error deleting asset: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Save data to IndexedDB
  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const result = await saveDataToIndexedDB();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        message: `Error saving data: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Export all assets to a zip file
  const handleExportZip = async () => {
    setIsSaving(true);
    try {
      const result = await exportToZip();
      setResult({
        success: result.success,
        message: result.message
      });
      
      if (result.success && result.url) {
        setExportUrl(result.url);
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error exporting data: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Download the exported zip file
  const handleDownloadZip = () => {
    if (exportUrl) {
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = 'campaign-data.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Render asset list for a specific type
  const renderAssetList = (type: AssetType, assets: string[]) => {
    if (isLoadingAssets) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={30} />
        </Box>
      );
    }
    
    if (assets.length === 0) {
      return (
        <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          No {type} assets found. Add some using the "Add {type}" button.
        </Typography>
      );
    }
    
    return (
      <List dense>
        {assets.map((asset) => (
          <ListItem key={asset}>
            <ListItemText 
              primary={asset} 
              secondary={type === 'data' ? 'JSON Data' : `${type.charAt(0).toUpperCase() + type.slice(1)} File`} 
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handleDeleteAsset(type, asset)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    );
  };
  
  // If still checking for assets, show a loading indicator
  if (isCheckingAssets) {
    return (
      <Paper 
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'rgba(45, 45, 45, 0.9)',
          transition: 'all 0.3s ease',
          position: 'relative',
          width: isFullPage ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Checking for stored assets...
        </Typography>
      </Paper>
    );
  }
  
  return (
    <>
      <Paper 
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'rgba(45, 45, 45, 0.9)',
          transition: 'all 0.3s ease',
          position: 'relative',
          width: isFullPage ? '100%' : 'auto',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Asset Manager
          </Typography>
          
          <Tooltip title={helpText} arrow placement="left">
            <IconButton size="small">
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Import section */}
        <Accordion
          defaultExpanded={!hasStoredAssets}
          sx={{ mb: 2, backgroundColor: 'rgba(60, 60, 60, 0.7)' }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Import ZIP File</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box 
              sx={{
                border: '2px dashed',
                borderColor: isDragging ? 'primary.main' : 'grey.500',
                borderRadius: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isProcessing ? (
                <CircularProgress size={30} sx={{ my: 2 }} />
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" gutterBottom>
                    Drag & Drop a ZIP file here, or click to select
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Your ZIP should contain audio/, images/, and data/ folders
                  </Typography>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".zip"
              />
            </Box>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                color="warning" 
                startIcon={<DeleteIcon />}
                onClick={handleClearAssets}
                disabled={isProcessing || !hasStoredAssets}
              >
                Clear All Assets
              </Button>
              
              {!hasStoredAssets && (
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleCreateEmptyData}
                  disabled={isProcessing}
                >
                  Create Empty Structure
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* Export section */}
        <Accordion
          sx={{ mb: 2, backgroundColor: 'rgba(60, 60, 60, 0.7)' }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Export Campaign</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" paragraph>
                Export your entire campaign as a ZIP file to backup your work or share it with others.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={handleExportZip}
                    disabled={isSaving || !hasStoredAssets}
                  >
                    {isSaving ? 'Preparing ZIP...' : 'Export Campaign ZIP'}
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadZip}
                    disabled={!exportUrl}
                  >
                    Download ZIP
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Button
              variant="outlined"
              color="success"
              fullWidth
              onClick={handleSaveData}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Current Campaign State'}
            </Button>
            
          </AccordionDetails>
        </Accordion>
        
        {/* Individual asset management */}
        <Accordion
          sx={{ backgroundColor: 'rgba(60, 60, 60, 0.7)' }}
          defaultExpanded={hasStoredAssets}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Manage Individual Assets</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Audio" />
                  <Tab label="Images" />
                  <Tab label="Data" />
                </Tabs>
              </Box>
              
              <Box sx={{ p: 1 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<UploadFileIcon />}
                  sx={{ mb: 1 }}
                  onClick={() => handleAddAssetClick(tabValue === 0 ? 'audio' : tabValue === 1 ? 'images' : 'data')}
                >
                  Add {tabValue === 0 ? 'Audio' : tabValue === 1 ? 'Image' : 'Data'} File
                </Button>
                
                {/* Tab panels */}
                <Box role="tabpanel" hidden={tabValue !== 0}>
                  {tabValue === 0 && renderAssetList('audio', audioAssets)}
                </Box>
                <Box role="tabpanel" hidden={tabValue !== 1}>
                  {tabValue === 1 && renderAssetList('images', imageAssets)}
                </Box>
                <Box role="tabpanel" hidden={tabValue !== 2}>
                  {tabValue === 2 && renderAssetList('data', dataAssets)}
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* Result message */}
        {result && (
          <Alert 
            severity={result.success ? 'success' : 'error'} 
            sx={{ mt: 2 }}
            action={
              <IconButton size="small" onClick={handleCloseAlert}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
            {result.message}
          </Alert>
        )}
      </Paper>
      
      {/* Dialog for adding individual assets */}
      <Dialog open={isAddAssetDialogOpen} onClose={() => setIsAddAssetDialogOpen(false)}>
        <DialogTitle>
          Add {currentAssetType === 'audio' ? 'Audio' : currentAssetType === 'images' ? 'Image' : 'Data'} File
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {currentAssetType === 'audio' && 'Select an audio file (MP3, WAV, OGG)'}
            {currentAssetType === 'images' && 'Select an image file (PNG, JPG, GIF)'}
            {currentAssetType === 'data' && 'Select a JSON data file'}
          </Typography>
          
          <Button
            variant="contained"
            component="label"
            fullWidth
          >
            Choose File
            <input
              type="file"
              ref={singleFileInputRef}
              hidden
              onChange={handleSingleFileSelect}
              accept={
                currentAssetType === 'audio' ? 'audio/*' :
                currentAssetType === 'images' ? 'image/*' :
                '.json'
              }
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddAssetDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 