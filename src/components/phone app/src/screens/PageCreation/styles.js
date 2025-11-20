import { StyleSheet } from 'react-native';
import { colors } from '../../utils';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.graycolor,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.btncolor,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.graycolor,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.graycolor,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  profileImagePlaceholderText: {
    fontSize: 14,
    color: colors.graycolor,
    marginTop: 8,
  },
  form: {
    paddingHorizontal: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.fontMainColor,
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    color: colors.fontMainColor,
    borderWidth: 1,
    borderColor: colors.graycolor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  description: {
    fontSize: 14,
    color: colors.graycolor,
    marginBottom: 10,
  },
  radioContainer: {
    gap: 15,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.graycolor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.btncolor,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.btncolor,
  },
  radioTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  radioText: {
    fontSize: 16,
    color: colors.fontMainColor,
    fontWeight: '500',
  },
  radioDescription: {
    fontSize: 14,
    color: colors.graycolor,
    marginTop: 2,
  },
  privacyInfo: {
    backgroundColor: colors.lightGray,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  privacyInfoText: {
    fontSize: 13,
    color: colors.graycolor,
    lineHeight: 18,
    marginBottom: 5,
  },
  privacyInfoBold: {
    fontWeight: '600',
    color: colors.fontMainColor,
  },
}); 