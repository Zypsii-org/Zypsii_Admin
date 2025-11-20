import { StyleSheet } from 'react-native';
import { colors } from '../../utils';
import { scale, verticalScale } from '../../utils';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: scale(5),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    marginLeft: scale(15),
    color: colors.fontMainColor,
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 12/12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  videoPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: verticalScale(10),
    fontSize: scale(16),
    color: colors.btncolor,
  },
  inputContainer: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleInput: {
    fontSize: scale(16),
    color: '#000',
    paddingVertical: verticalScale(8),
  },
  descriptionInput: {
    fontSize: scale(16),
    color: '#000',
    paddingVertical: verticalScale(8),
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.btncolor,
    margin: scale(10),
    padding: scale(10),
    borderRadius: scale(5),
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
  },
});

export default styles;